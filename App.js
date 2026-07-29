import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { fontMap } from './shared/styles/fonts';

// 폰트가 로드되기 전까지 스플래시를 유지
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [loaded, error] = useFonts(fontMap);

  useEffect(() => {
    // 로드 완료(또는 실패) 시 스플래시 숨김
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // 아직 로딩 중이면 아무것도 렌더하지 않음 (스플래시 유지)
  if (!loaded && !error) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
