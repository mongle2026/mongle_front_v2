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
import LetterSendScreen from './features/write/send/LetterSendScreen';
import LetterBoxScreen from './features/letterbox/LetterBoxScreen';
import ArchiveScreen from './features/archive/ArchiveScreen';
import ProfileScreen from './features/profile/ProfileScreen';
import LetterDetailScreen from './features/letterbox/letter/detail/LetterDetailScreen';
import StampDetailScreen from './features/letterbox/stamp/detail/StampDetailScreen';
import NotificationScreen from './features/notification/NotificationScreen';
import GenreScreen from './features/archive/myfeed/genre/GenreScreen';
import GenreDetailScreen from './features/archive/myfeed/genre/detail/GenreDetailScreen';
import AllScreen from './features/archive/myfeed/all/AllScreen';
import CatalogScreen from './features/catalog/CatalogScreen';
import WelcomeScreen from './features/auth/WelcomeScreen';
import TermsScreen from './features/signup/terms/TermsScreen';
import SignupScreen from './features/signup/SignupScreen';
import PushNotificationHandler from './features/notification/push/PushNotificationHandler';
import DialogProvider from './shared/providers/DialogProvider';
import GlobalOverlayProvider from './shared/providers/GlobalOverlayProvider';
import BottomNavigation from './shared/components/navigation/bottomnavigation/BottomNavigation';
import { MAIN_TAB_ROUTES } from './shared/components/navigation/bottomnavigation/routeNames';
import { AUTH_STATUS, useAuthStore } from './shared/auth/useAuthStore';

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
        backgroundColor: colors.bgBase,
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
    <Tab.Screen
      name={MAIN_TAB_ROUTES.PROFILE}
      component={ProfileScreen}
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

// 로그인 여부에 따라 화면 묶음을 바꾼다. 로그인 · 가입하거나 refresh 가 실패해 로그아웃되면
// 바뀐 묶음의 첫 화면(MainTabs / Welcome)으로 자동으로 넘어간다
const RootNavigator = ({ isSignedIn }) => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    {isSignedIn ? (
      <Stack.Group>
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
          name="LetterSend"
          component={LetterSendScreen}
          options={{
            // 보내는 중에는 뒤로가기 제스처를 막는다 (완료 화면에서 닫기로 나간다)
            gestureEnabled: false,
            animation: 'fade',
          }}
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
        <Stack.Screen
          name="MyFeedAll"
          component={AllScreen}
          options={{
            animation: 'ios_from_right',
          }}
        />
        {/* 개발 빌드에서만 등록하는 컴포넌트 카탈로그 (프로필 탭에서 진입) */}
        {__DEV__ && (
          <Stack.Screen
            name="Catalog"
            component={CatalogScreen}
            options={{
              animation: 'ios_from_right',
            }}
          />
        )}
      </Stack.Group>
    ) : (
      <Stack.Group>
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
        />
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
        />
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
        />
      </Stack.Group>
    )}
  </Stack.Navigator>
);

export default function App() {
  const [loaded, error] = useFonts(fontMap);
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  const authStatus = useAuthStore(state => state.status);
  const restoreSession = useAuthStore(state => state.restoreSession);
  const isAuthRestored = authStatus !== AUTH_STATUS.RESTORING;

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  // 로그아웃하면 이전 계정으로 받아 둔 데이터를 지운다
  useEffect(() => {
    if (authStatus === AUTH_STATUS.SIGNED_OUT) {
      queryClient.clear();
    }
  }, [authStatus]);

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
    if (error) {
      // 로딩에 실패해도 앱은 띄우되(시스템 폰트로 대체됨) 원인은 남긴다.
      console.warn('폰트를 불러오지 못했습니다.', error);
    }

    // 저장된 로그인 정보를 읽을 때까지 스플래시를 유지해서 Welcome 이 잠깐 보이지 않게 한다
    if ((loaded || error) && isAuthRestored) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isAuthRestored]);

  if ((!loaded && !error) || !isAuthRestored) {
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
                <RootNavigator isSignedIn={authStatus === AUTH_STATUS.SIGNED_IN} />
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