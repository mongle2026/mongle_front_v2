const fs = require('fs');
const path = require('path');

// eas-cli 는 설정을 읽을 때 .env 를 불러오지 않아서 여기서 직접 읽는다.
// 이미 있는 환경변수(EAS 환경변수 등)는 덮어쓰지 않고, .env 가 없는 EAS 빌드 서버에서는 건너뛴다.
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const kakaoNativeAppKey = process.env.KAKAO_NATIVE_APP_KEY;

// 안드로이드 푸시(FCM)용 Firebase 설정 파일. 파일이 있을 때만 연결해서, 없어도 빌드는 된다.
// git 에 올리지 않는 파일이라 EAS 빌드 서버에서는 파일 환경변수 GOOGLE_SERVICES_JSON 이 파일 경로를 준다.
const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';
const hasGoogleServicesFile = fs.existsSync(
  path.resolve(__dirname, googleServicesFile),
);

if (!kakaoNativeAppKey) {
  throw new Error(
    'KAKAO_NATIVE_APP_KEY가 설정되어 있지 않습니다. .env 파일을 확인해주세요.',
  );
}

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(hasGoogleServicesFile && { googleServicesFile }),
  },
  extra: {
    ...(config.extra ?? {}),
    kakaoNativeAppKey,
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-build-properties',
      {
        android: {
          extraMavenRepos: [
            'https://devrepo.kakao.com/nexus/content/groups/public/',
          ],
        },
      },
    ],
    [
      '@react-native-kakao/core',
      {
        nativeAppKey: kakaoNativeAppKey,
      },
    ],
  ],
});