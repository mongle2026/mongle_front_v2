import { registerRootComponent } from 'expo';
import Constants from 'expo-constants';
import { initializeKakaoSDK } from '@react-native-kakao/core';
import App from './App';

const kakaoNativeAppKey =
    Constants.expoConfig?.extra?.kakaoNativeAppKey;

if (!kakaoNativeAppKey) {
    throw new Error('Kakao Native App Key를 찾을 수 없습니다.');
}

initializeKakaoSDK(kakaoNativeAppKey);

registerRootComponent(App);