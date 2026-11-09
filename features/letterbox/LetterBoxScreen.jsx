import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import WriteFab, { DEFAULT_WRITE_FAB_HEIGHT } from '../../shared/components/action/WriteFab';
import Empty from '../../shared/components/content/Empty';
import TopNavigation from '../../shared/components/navigation/topnavigation/TopNavigation';
import { LETTER_BOX_TAB, LETTER_TOP_NAVIGATION_TABS } from './constants';
import useCurrentUser from '../../shared/hooks/useCurrentUser';
import { useIsSignedIn } from '../../shared/auth/useAuthStore';
import { colors } from '../../shared/styles/color';

import LetterSection from './letter/home/LetterSection';
import StampSection from './stamp/home/StampSection';
import { prefetchStampDetail } from './stamp/detail/hooks/useStampDetail';
import { prefetchStampBox } from './stamp/home/hooks/useStampBox';
import useHasUnreadNotification from '../notification/hooks/useHasUnreadNotification';

// 탭을 바꾸면 피드 홈과 같은 값으로 내용이 옆에서 들어온다
const TAB_SWITCH_OFFSET = 24;
const TAB_SWITCH_TIMING = { duration: 280, easing: Easing.out(Easing.cubic) };
const getTabIndex = tab => LETTER_TOP_NAVIGATION_TABS.findIndex(item => item.key === tab);

// 편지 · 우표 섹션을 같은 자리에 겹쳐 두고, 보이는 탭만 드러낸다.
// display: 'none' 은 네이티브 뷰를 내려서 스크롤 위치가 사라지므로 투명하게만 숨기고, 터치 · 스크린리더에서 뺀다
const TabLayer = ({ isActive, children }) => (
  <View
    style={[styles.layer, !isActive && styles.hiddenLayer]}
    pointerEvents={isActive ? 'auto' : 'none'}
    accessibilityElementsHidden={!isActive}
    importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
  >
    {children}
  </View>
);

const LetterBoxScreen = ({ navigation }) => {
  const { userId } = useCurrentUser();
  const isSignedIn = useIsSignedIn();
  const hasUnreadNotification = useHasUnreadNotification();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(LETTER_BOX_TAB.LETTER);
  const isLetterTab = activeTab === LETTER_BOX_TAB.LETTER;
  const isStampTab = activeTab === LETTER_BOX_TAB.STAMP;

  // 우표 탭은 처음 열 때 마운트하고, 그 뒤로는 편지 탭과 함께 마운트된 채 보이기만 바꾼다
  // (탭을 오갈 때마다 섹션을 처음부터 다시 그리지 않게)
  const [hasOpenedStamp, setHasOpenedStamp] = useState(false);
  if (isStampTab && !hasOpenedStamp) setHasOpenedStamp(true);

  // 우표 탭에 다녀오면 편지 탭은 처음 들어올 때처럼 초기화한다 (기본 필터 · 탭 순서 · 스크롤 · 편지 더미 모아짐).
  // 섹션을 다시 마운트하면 봉투 SVG 를 전부 새로 그려야 해서 느리므로, resetKey 만 올려 LetterSection 이 상태를 되돌린다.
  // 우표 탭으로 넘어가는 애니메이션이 끝난 뒤 숨겨진 채로 하고, 그 전에 편지 탭으로 돌아오면 돌아올 때 바로 초기화한다.
  const [letterResetKey, setLetterResetKey] = useState(0);
  const [isLetterResetPending, setIsLetterResetPending] = useState(false);

  const handleChangeTab = useCallback(nextTab => {
    if (nextTab === activeTab) return;
    setActiveTab(nextTab);

    if (nextTab === LETTER_BOX_TAB.STAMP) {
      setIsLetterResetPending(true);
    } else if (isLetterResetPending) {
      setIsLetterResetPending(false);
      setLetterResetKey(key => key + 1);
    }
  }, [activeTab, isLetterResetPending]);

  useEffect(() => {
    if (!isLetterResetPending) return undefined;

    const timer = setTimeout(() => {
      setIsLetterResetPending(false);
      setLetterResetKey(key => key + 1);
    }, TAB_SWITCH_TIMING.duration);
    return () => clearTimeout(timer);
  }, [isLetterResetPending]);

  const tabSwitchProgress = useSharedValue(1);
  const tabSwitchDirection = useSharedValue(0);
  const prevTabRef = useRef(activeTab);

  useEffect(() => {
    const prevTab = prevTabRef.current;
    if (prevTab === activeTab) return;
    prevTabRef.current = activeTab;

    tabSwitchDirection.value = Math.sign(getTabIndex(activeTab) - getTabIndex(prevTab));
    tabSwitchProgress.value = 0;
    tabSwitchProgress.value = withTiming(1, TAB_SWITCH_TIMING);
  }, [activeTab, tabSwitchDirection, tabSwitchProgress]);

  const tabSwitchStyle = useAnimatedStyle(() => ({
    opacity: tabSwitchProgress.value,
    transform: [
      {
        translateX: (1 - tabSwitchProgress.value) * TAB_SWITCH_OFFSET * tabSwitchDirection.value,
      },
    ],
  }));

  // 우표 탭을 열기 전에 받은 우표 개수를 미리 불러온다
  useEffect(() => {
    if (isSignedIn) prefetchStampBox(queryClient, { userId });
  }, [isSignedIn, queryClient, userId]);

  const [fabHeight, setFabHeight] = useState(DEFAULT_WRITE_FAB_HEIGHT);

  const handlePressBell = useCallback(() => {
    navigation.navigate('Notification');
  }, [navigation]);

  const handlePressLogin = useCallback(() => {
    navigation.navigate('Welcome');
  }, [navigation]);

  const handlePressLetter = useCallback(letter => {
    navigation.navigate('LetterDetail', { letterId: letter.letterId });
  }, [navigation]);

  const handlePressStamp = useCallback(stampCode => {
    prefetchStampDetail(queryClient, { stampCode, userId });
    navigation.navigate('StampDetail', { stampCode });
  }, [navigation, queryClient, userId]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        <TopNavigation
          tabs={LETTER_TOP_NAVIGATION_TABS}
          activeTab={activeTab}
          onChangeTab={handleChangeTab}
          onPressButton={handlePressBell}
          showDot={hasUnreadNotification}
        />
      </SafeAreaView>

      {/* 로그인하지 않았으면 편지 탭은 필터 Tabs 아래에, 우표 탭은 바로 엠티뷰를 보여준다. 작성 FAB 은 남겨 두고 누르면 로그인 안내 Dialog 를 띄운다 */}
      <Animated.View style={[styles.content, tabSwitchStyle]}>
        <TabLayer isActive={isLetterTab}>
          <LetterSection
            resetKey={letterResetKey}
            userId={userId}
            isSignedIn={isSignedIn}
            bottomInset={fabHeight}
            onPressLetter={handlePressLetter}
            onPressLogin={handlePressLogin}
          />
        </TabLayer>
        {hasOpenedStamp && (
          <TabLayer isActive={isStampTab}>
            {isSignedIn ? (
              <StampSection userId={userId} bottomInset={fabHeight} onPressStamp={handlePressStamp} />
            ) : (
              <View style={[styles.loginEmpty, { paddingBottom: fabHeight }]}>
                <Empty
                  type="login"
                  title="로그인이 필요해요"
                  buttonLabel="로그인하러 가기"
                  onButtonPress={handlePressLogin}
                />
              </View>
            )}
          </TabLayer>
        )}
      </Animated.View>

      <WriteFab navigation={navigation} expandedLabel="편지함 더 둘러보기" onHeightChange={setFabHeight} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.bgBase,
  },
  topSafeArea: {
    width: '100%',
    zIndex: 10,
    backgroundColor: colors.bgBase,
  },
  content: {
    flex: 1,
    width: '100%',
  },
  layer: {
    ...StyleSheet.absoluteFill,
  },
  hiddenLayer: {
    opacity: 0,
  },
  // FAB 에 가려지는 높이(paddingBottom)를 빼고 가운데에 둔다
  loginEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default LetterBoxScreen;
