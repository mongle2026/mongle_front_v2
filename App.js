import { useEffect, useState } from 'react';
import { Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
import ProfileInfoEditScreen from './features/profile/infoedit/ProfileInfoEditScreen';
import ProfileFeedEditScreen from './features/profile/feededit/ProfileFeedEditScreen';
import ProfileFollowScreen from './features/profile/follow/ProfileFollowScreen';
import UserProfileScreen from './features/profile/user/UserProfileScreen';
import SettingScreen from './features/setting/SettingScreen';
import SettingNotificationScreen from './features/setting/notification/SettingNotificationScreen';
import SettingAccountScreen from './features/setting/account/SettingAccountScreen';
import SettingAccountWithdrawScreen from './features/setting/account/withdraw/SettingAccountWithdrawScreen';
import LetterDetailScreen from './features/letterbox/letter/detail/LetterDetailScreen';
import StampDetailScreen from './features/letterbox/stamp/detail/StampDetailScreen';
import NotificationScreen from './features/notification/NotificationScreen';
import GenreScreen from './features/archive/myfeed/genre/GenreScreen';
import GenreDetailScreen from './features/archive/myfeed/genre/detail/GenreDetailScreen';
import AllScreen from './features/archive/myfeed/all/AllScreen';
import CatalogScreen from './features/catalog/CatalogScreen';
import OnboardingScreen from './features/onboarding/OnboardingScreen';
import { useOnboardingStore } from './features/onboarding/useOnboardingStore';
import WelcomeScreen from './features/auth/WelcomeScreen';
import TermsScreen from './features/signup/terms/TermsScreen';
import SignupScreen from './features/signup/SignupScreen';
import SignupCompleteScreen from './features/signup/complete/SignupCompleteScreen';
import NotificationPermissionScreen from './features/notification/permission/NotificationPermissionScreen';
import PushNotificationHandler from './features/notification/push/PushNotificationHandler';
import AppSplash from './features/splash/AppSplash';
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

const TAB_FADE_TRANSITION_SPEC = {
  animation: 'timing',
  config: {
    duration: 220,
    easing: Easing.inOut(Easing.ease),
  },
};

const MainTabNavigator = () => (
  <Tab.Navigator
    initialRouteName={MAIN_TAB_ROUTES.FEED}
    screenOptions={{
      headerShown: false,
      sceneStyle: {
        backgroundColor: colors.bgBase,
      },
      // 탭을 옮길 때(하단 탭바 · 보관함 엠티뷰의 '피드 둘러보기' 등) 화면이 툭 바뀌지 않고 크로스페이드된다
      animation: 'fade',
      transitionSpec: TAB_FADE_TRANSITION_SPEC,
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

/*
 * MainTabs · FeedDetail · Notification · Setting 은 로그인하지 않아도 볼 수 있다
 * (피드 추천 · 상세만 내용이 보이고 나머지 탭과 알림은 로그인 엠티뷰, 설정은 약관 및 정책부터).
 * 나머지는 로그인 여부에 따라 묶음을 바꾼다. 로그인하지 않았을 때 Welcome 은 로그인 버튼 · Dialog 로 위에 띄운다.
 * 로그인 · 가입하면 Welcome · 약관 · 가입 화면이 빠지면서 보던 화면(MainTabs / FeedDetail)으로 돌아오고
 * (가입은 가입 완료 화면을 먼저 띄우고, 시작하기로 닫으면 돌아온다. 가입 완료 다음 · 로그인 직후에는
 * 이 기기에서 알림 권한을 아직 묻지 않았으면 알림 권한 화면을 거친다),
 * refresh 가 실패해 로그아웃되면 로그인 전용 화면이 빠지면서 남은 화면을 로그인 전 상태로 보여준다
 */
const RootNavigator = ({ isSignedIn, showOnboarding }) => (
  <Stack.Navigator
    // 앱을 처음 켰을 때만 온보딩부터 보여준다. 온보딩을 마치면 MainTabs로 돌아온다
    initialRouteName={showOnboarding ? 'Onboarding' : 'MainTabs'}
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
      name="Notification"
      component={NotificationScreen}
    />
    <Stack.Screen
      name="Setting"
      component={SettingScreen}
      options={{
        animation: 'ios_from_right',
      }}
    />
    {/* 가입 완료. 가입 화면에서 띄운 뒤 로그인되어도 남아 있도록 로그인 여부와 상관없이 둔다 */}
    <Stack.Screen
      name="SignupComplete"
      component={SignupCompleteScreen}
      options={{
        // 시작하기로만 나간다 (뒤에 있던 가입 화면은 로그인되면서 빠진다)
        gestureEnabled: false,
      }}
    />
    {/* 알림 권한. 가입 완료 다음 · 로그인 직후에 뜬다. 로그인 전에 띄워서 Welcome 이 빠져도 남도록 로그인 여부와 상관없이 둔다 */}
    <Stack.Screen
      name="NotificationPermission"
      component={NotificationPermissionScreen}
      options={{
        // 알림 받기 · 다음에 할게요로만 나간다
        gestureEnabled: false,
      }}
    />
    {isSignedIn ? (
      <Stack.Group>
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
        <Stack.Screen
          name="ProfileInfoEdit"
          component={ProfileInfoEditScreen}
          options={{
            animation: 'ios_from_right',
          }}
        />
        <Stack.Screen
          name="ProfileFeedEdit"
          component={ProfileFeedEditScreen}
          options={{
            animation: 'ios_from_right',
          }}
        />
        <Stack.Screen
          name="ProfileFollow"
          component={ProfileFollowScreen}
          options={{
            animation: 'ios_from_right',
          }}
        />
        {/* 다른 사람 프로필. params: { userId } (publicId) */}
        <Stack.Screen
          name="UserProfile"
          component={UserProfileScreen}
          options={{
            animation: 'ios_from_right',
          }}
        />
        <Stack.Screen
          name="SettingNotification"
          component={SettingNotificationScreen}
          options={{
            animation: 'ios_from_right',
          }}
        />
        <Stack.Screen
          name="SettingAccount"
          component={SettingAccountScreen}
          options={{
            animation: 'ios_from_right',
          }}
        />
        <Stack.Screen
          name="SettingAccountWithdraw"
          component={SettingAccountWithdrawScreen}
          options={{
            animation: 'ios_from_right',
          }}
        />
        {/* 개발 빌드에서만 등록하는 컴포넌트 카탈로그 (프로필의 설정 버튼을 길게 눌러 진입) */}
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
          name="Onboarding"
          component={OnboardingScreen}
        />
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
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const authStatus = useAuthStore(state => state.status);
  const restoreSession = useAuthStore(state => state.restoreSession);
  const isAuthRestored = authStatus !== AUTH_STATUS.RESTORING;

  const isOnboardingRestored = useOnboardingStore(state => state.isRestored);
  const isOnboardingCompleted = useOnboardingStore(state => state.isCompleted);
  const restoreOnboarding = useOnboardingStore(state => state.restore);

  // 첫 화면(온보딩 / 피드 홈)을 정하려면 로그인 정보와 온보딩 완료 여부를 둘 다 읽어야 한다
  const isStartupRestored = isAuthRestored && isOnboardingRestored;
  const isSignedIn = authStatus === AUTH_STATUS.SIGNED_IN;

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    void restoreOnboarding();
  }, [restoreOnboarding]);

  // 로그아웃하면 이전 계정으로 받아 둔 데이터를 지운다.
  // 피드는 로그인하지 않아도 떠 있으므로, 지금 화면이 쓰는(로그인 전 상태로 새로 받는) 조회는 남긴다
  useEffect(() => {
    if (authStatus === AUTH_STATUS.SIGNED_OUT) {
      queryClient.removeQueries({ type: 'inactive' });
      queryClient.getMutationCache().clear();
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

  // 폰트는 빌드할 때 앱에 넣어서(app.json expo-font) 따로 불러올 필요가 없다.
  // AppSplash가 그려지면 바로 네이티브 스플래시를 내리고 같은 배경의 AppSplash로 넘긴다
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  /*
   * AppSplash 는 앱 화면 위에 덮여서 인트로 모션을 보여 준다.
   * 저장된 로그인 정보 · 온보딩 완료 여부를 읽기 전에는 앱 화면을 그리지 않아서 엉뚱한 첫 화면이 보이지 않고,
   * 읽고 나면 스플래시 아래에서 첫 화면을 미리 그려 두었다가 인트로가 끝나면 스플래시가 걷히며 드러난다.
   * 스플래시 자리가 바뀌면 모션이 처음부터 다시 시작되므로 항상 루트의 마지막 자식으로 둔다
   */
  return (
    <GestureHandlerRootView
      style={{ flex: 1 }}
    >
      {isStartupRestored && (
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
                  <RootNavigator
                    isSignedIn={isSignedIn}
                    showOnboarding={!isSignedIn && !isOnboardingCompleted}
                  />
                </NavigationContainer>
                <PushNotificationHandler
                  navigationRef={navigationRef}
                  isNavigationReady={isNavigationReady}
                />
                {/* 스플래시가 떠 있는 동안은 스플래시가 상태바 색을 정한다 */}
                {!isSplashVisible && <StatusBar style="dark" />}
              </GlobalOverlayProvider>
            </DialogProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      )}
      {isSplashVisible && (
        <AppSplash
          isReady={isStartupRestored}
          onFinish={() => setIsSplashVisible(false)}
        />
      )}
    </GestureHandlerRootView>
  );
}
