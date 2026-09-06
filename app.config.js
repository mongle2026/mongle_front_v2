const kakaoNativeAppKey = process.env.KAKAO_NATIVE_APP_KEY;

if (!kakaoNativeAppKey) {
  throw new Error(
    'KAKAO_NATIVE_APP_KEY가 설정되어 있지 않습니다. .env 파일을 확인해주세요.',
  );
}

module.exports = ({ config }) => ({
  ...config,
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