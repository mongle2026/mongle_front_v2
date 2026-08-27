import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import { setAudioModeAsync } from 'expo-audio';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView, } from 'react-native-gesture-handler';
import { fontMap } from './shared/styles/fonts';
import { colors } from './shared/styles/color';
import FeedHomeScreen from './features/feed/home/FeedHomeScreen';
import FeedDetailScreen from './features/feed/detail/FeedDetailScreen';
import RecordScreen from './features/write/record/RecordScreen';
import DialogProvider from './shared/providers/DialogProvider';
import GlobalOverlayProvider from './shared/providers/GlobalOverlayProvider';
import BottomNavigation from './shared/components/navigation/bottomnavigation/BottomNavigation';
import { MAIN_TAB_ROUTES } from './shared/components/navigation/bottomnavigation/routeNames';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const kakaoNativeAppKey =
  Constants.expoConfig?.extra?.kakaoNativeAppKey;

const linking = {
  prefixes: [
    `kakao${kakaoNativeAppKey}://`,
  ],
  config: {
    screens: {
      FeedDetail: {
        path: 'kakaolink',
        parse: {
          feedId: String,
          visibility: String,
        },
      },
    },
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const TemporaryScreen = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: '#FFFFFF',
    }}
  />
);

const MainTabNavigator = () => (
  <Tab.Navigator
    initialRouteName={MAIN_TAB_ROUTES.FEED}
    screenOptions={{
      headerShown: false,
      sceneStyle: {
        backgroundColor: colors.bgLayerBasement,
      },
    }}
    tabBar={props => <BottomNavigation {...props} />}
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

const FeedDetailRoute = props => (
  <SafeAreaProvider>
    <FeedDetailScreen {...props} />
  </SafeAreaProvider>
);

const RootNavigator = () => (
  <Stack.Navigator
    initialRouteName="MainTabs"
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen
      name="MainTabs"
      component={MainTabNavigator}
    />
    <Stack.Screen
      name="FeedDetail"
      component={FeedDetailRoute}
      options={{
        presentation: 'transparentModal',
      }}
    />
    <Stack.Screen
      name="Record"
      component={RecordScreen}
    />
  </Stack.Navigator>
);

export default function App() {
  const [loaded, error] = useFonts(fontMap);

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
        });
      } catch (error) {
        console.warn('오디오 모드를 설정하지 못했습니다.', error);
      }
    };

    void configureAudio();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1 }}
    >
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <DialogProvider>
            <GlobalOverlayProvider>
              <NavigationContainer linking={linking}>
                <RootNavigator />
              </NavigationContainer>
              <StatusBar style="dark" />
            </GlobalOverlayProvider>
          </DialogProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}