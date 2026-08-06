import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { NavigationContainer, } from '@react-navigation/native';
import { createBottomTabNavigator, } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, } from '@tanstack/react-query';

import { fontMap } from './shared/styles/fonts';

import FeedHomeScreen from './features/feed/home/FeedHomeScreen';

import GlobalOverlayProvider from './shared/components/layout/GlobalOverlayProvider';
import BottomNavigation from './shared/components/navigation/bottomnavigation/BottomNavigation';
import { MAIN_TAB_ROUTES, } from './shared/components/navigation/bottomnavigation/routeNames';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

/*
 * App가 다시 렌더링될 때마다 QueryClient가 새로 생성되지 않도록
 * 컴포넌트 바깥에 선언합니다.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/*
 * 편지와 프로필 화면이 만들어지기 전까지 사용할 임시 화면입니다.
 * BottomNavigation의 세 탭을 정상적으로 표시하기 위해 등록합니다.
 */
const TemporaryScreen = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
      }}
    />
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName={MAIN_TAB_ROUTES.FEED}
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => (
        <BottomNavigation {...props} />
      )}
    >
      <Tab.Screen
        name={MAIN_TAB_ROUTES.FEED}
        component={FeedHomeScreen}
      />

      <Tab.Screen
        name={MAIN_TAB_ROUTES.LETTER}
        component={TemporaryScreen}
      />

      <Tab.Screen
        name={MAIN_TAB_ROUTES.PROFILE}
        component={TemporaryScreen}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  const [loaded, error] = useFonts(fontMap);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <GlobalOverlayProvider>
          <NavigationContainer>
            <MainTabNavigator />
          </NavigationContainer>

          <StatusBar style="dark" />
        </GlobalOverlayProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}