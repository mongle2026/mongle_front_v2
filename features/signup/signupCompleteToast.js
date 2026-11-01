// 둘러보다가 가입하고 돌아간 화면에 띄우는 가입 완료 Toast.
// 보통은 가입 흐름의 마지막 화면(가입 완료 · 알림 권한)이 닫히면서 바로 띄우고,
// 하단 바 위에 띄워야 하는 화면(피드 상세)은 바 높이를 아는 그 화면이 띄우도록 돌아갈 화면의 key 를 남겨 둔다

import { useCallback, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useGlobalOverlay } from '../../shared/providers/GlobalOverlayProvider';

const SIGNUP_COMPLETE_TOAST_MESSAGE = '가입을 완료했어요.';

// 가입 완료 Toast 를 직접 띄우는 화면 (useSignupCompleteToast)
const SELF_TOAST_ROUTE_NAMES = ['FeedDetail'];

// 넘겨받은 Toast 를 띄울 화면의 route key
const usePendingSignupCompleteToastStore = create(() => ({
  routeKey: null,
}));

/**
 * 가입 흐름의 마지막 화면을 닫고 가입 전에 보던 화면으로 돌아간다.
 * goBack(showToast): showToast 가 true 면 돌아간 화면에 가입 완료 Toast 를 띄운다
 */
export const useGoBackWithSignupCompleteToast = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { showToast } = useGlobalOverlay();

  return useCallback(shouldShowToast => {
    const { routes, index } = navigation.getState();
    const previousRoute = routes[index - 1];

    navigation.goBack();

    if (!shouldShowToast) return;

    if (SELF_TOAST_ROUTE_NAMES.includes(previousRoute?.name)) {
      usePendingSignupCompleteToastStore.setState({ routeKey: previousRoute.key });
      return;
    }

    showToast({
      message: SIGNUP_COMPLETE_TOAST_MESSAGE,
      bottomOffset: insets.bottom,
    });
  }, [insets.bottom, navigation, showToast]);
};

/**
 * 가입 흐름의 마지막 화면에서 넘겨받은 Toast 를 띄운다.
 *
 * @param {boolean} [enabled] false 면 true 가 될 때까지 미룬다 (하단 바 높이를 재기 전 등)
 */
export const useSignupCompleteToast = ({ bottomOffset, enabled = true }) => {
  const { showToast } = useGlobalOverlay();
  const { key: routeKey } = useRoute();
  const isPending = usePendingSignupCompleteToastStore(
    state => state.routeKey === routeKey,
  );

  useEffect(() => {
    if (!enabled || !isPending) return;

    usePendingSignupCompleteToastStore.setState({ routeKey: null });

    showToast({
      message: SIGNUP_COMPLETE_TOAST_MESSAGE,
      bottomOffset,
    });
  }, [bottomOffset, enabled, isPending, showToast]);
};
