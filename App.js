import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { setAudioModeAsync } from 'expo-audio';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView, } from 'react-native-gesture-handler';
import { fontMap } from './shared/styles/fonts';
import { colors } from './shared/styles/color';
import FeedHomeScreen from './features/feed/home/FeedHomeScreen';
import FeedDetailScreen from './features/feed/detail/FeedDetailScreen';
import RecordScreen from './features/write/record/RecordScreen';
import RecordEditScreen from './features/write/record/RecordEditScreen';
import EnvelopeScreen from './features/write/envelope/EnvelopeScreen';
import LetterBoxScreen from './features/letterbox/LetterBoxScreen';
import ArchiveScreen from './features/archive/ArchiveScreen';
import LetterDetailScreen from './features/letterbox/letter/detail/LetterDetailScreen';
import StampDetailScreen from './features/letterbox/stamp/detail/StampDetailScreen';
import NotificationScreen from './features/notification/NotificationScreen';
import GenreScreen from './features/archive/myfeed/genre/GenreScreen';
import GenreDetailScreen from './features/archive/myfeed/genre/detail/GenreDetailScreen';
import PushNotificationHandler from './features/notification/push/PushNotificationHandler';
import DialogProvider from './shared/providers/DialogProvider';
import GlobalOverlayProvider from './shared/providers/GlobalOverlayProvider';
import BottomNavigation from './shared/components/navigation/bottomnavigation/BottomNavigation';
import { MAIN_TAB_ROUTES } from './shared/components/navigation/bottomnavigation/routeNames';

SplashScreen.preventAutoHideAsync();

// 푸시 알림을 눌렀을 때처럼 화면 밖에서 이동해야 할 때 쓴다
const navigationRef = createNavigationContainerRef();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [
    // 공유 웹페이지(/feed/share/:feedId)가 앱으로 딥링크할 때 사용하는 커스텀 스킴
    'mongle://',
  ],
  config: {
    // 콜드 스타트로 딥링크를 열어도 MainTabs를 아래에 깔아서
    // FeedDetail에서 뒤로 가기로 나갈 수 있게 함
    initialRouteName: 'MainTabs',
    screens: {
      FeedDetail: {
        path: 'share',
        parse: {
          feedId: String,
        },
      },
    },
  },
};

// 따로 staleTime을 정하지 않은 조회(편지함 · 우표 · 검색 등)는 30초 동안 새 데이터로 본다.
// 0이면 화면이 열릴 때마다 다시 요청해서, 우표 상세처럼 미리 불러온(prefetch) 데이터도 바로 다시 요청한다
const DEFAULT_STALE_TIME = 30 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      // 4xx(없는 글, 권한 없음 등)는 다시 요청해도 같은 결과라 재시도하지 않는다
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

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
      component={LetterBoxScreen}
    />
    <Tab.Screen
      name={MAIN_TAB_ROUTES.ARCHIVE}
      component={ArchiveScreen}
    />
  </Tab.Navigator>
);

const FeedDetailRoute = props => (
  <SafeAreaProvider
    initialMetrics={initialWindowMetrics}
  >
    <FeedDetailScreen {...props} />
  </SafeAreaProvider>
);

// 투명 모달은 (iOS에서) 별도 네이티브 화면으로 떠서, 안의 BottomSheet 제스처와
// 안전영역이 동작하도록 루트를 한 번 더 감싼다
const StampDetailRoute = props => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider
      initialMetrics={initialWindowMetrics}
    >
      <StampDetailScreen {...props} />
    </SafeAreaProvider>
  </GestureHandlerRootView>
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
        animation: 'ios_from_right',
      }}
    />
    <Stack.Screen
      name="LetterDetail"
      component={LetterDetailScreen}
      options={{
        animation: 'ios_from_right',
      }}
    />
    <Stack.Screen
      name="StampDetail"
      component={StampDetailRoute}
      options={{
        presentation: 'transparentModal',
        animation: 'fade',
      }}
    />
    <Stack.Screen
      name="Record"
      component={RecordScreen}
    />
    <Stack.Screen
      name="RecordEdit"
      component={RecordEditScreen}
    />
    <Stack.Screen
      name="Envelope"
      component={EnvelopeScreen}
    />
    <Stack.Screen
      name="Notification"
      component={NotificationScreen}
    />
    <Stack.Screen
      name="MyFeedGenre"
      component={GenreScreen}
      options={{
        animation: 'ios_from_right',
      }}
    />
    <Stack.Screen
      name="MyFeedGenreDetail"
      component={GenreDetailScreen}
      options={{
        animation: 'ios_from_right',
      }}
    />
  </Stack.Navigator>
);

export default function App() {
  const [loaded, error] = useFonts(fontMap);
  const [isNavigationReady, setIsNavigationReady] = useState(false);

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
      <SafeAreaProvider
        initialMetrics={initialWindowMetrics}
      >
        <QueryClientProvider client={queryClient}>
          <DialogProvider>
            <GlobalOverlayProvider>
              <NavigationContainer
                ref={navigationRef}
                linking={linking}
                onReady={() => setIsNavigationReady(true)}
              >
                <RootNavigator />
              </NavigationContainer>
              <PushNotificationHandler
                navigationRef={navigationRef}
                isNavigationReady={isNavigationReady}
              />
              <StatusBar style="dark" />
            </GlobalOverlayProvider>
          </DialogProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}