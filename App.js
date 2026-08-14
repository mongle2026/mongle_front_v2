import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { fontMap } from './shared/styles/fonts';
import { colors } from './shared/styles/color';

import FeedHomeScreen from './features/feed/home/FeedHomeScreen';
import FeedDetailScreen from './features/feed/detail/FeedDetailScreen';

import GlobalOverlayProvider from './shared/components/layout/GlobalOverlayProvider';
import BottomNavigation from './shared/components/navigation/bottomnavigation/BottomNavigation';
import { MAIN_TAB_ROUTES } from './shared/components/navigation/bottomnavigation/routeNames';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
      component={FeedDetailScreen}
      options={{
        presentation: 'transparentModal',
      }}
    />
  </Stack.Navigator>
);

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
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="dark" />
        </GlobalOverlayProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}