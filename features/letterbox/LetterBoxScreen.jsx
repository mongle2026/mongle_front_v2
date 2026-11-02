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

// 탭을 바꾸면 피드 홈과 같은 값으로 내용이 옆에서 들어온다
const TAB_SWITCH_OFFSET = 24;
const TAB_SWITCH_TIMING = { duration: 280, easing: Easing.out(Easing.cubic) };
const getTabIndex = tab => LETTER_TOP_NAVIGATION_TABS.findIndex(item => item.key === tab);

const LetterBoxScreen = ({ navigation }) => {
  const { userId } = useCurrentUser();
  const isSignedIn = useIsSignedIn();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(LETTER_BOX_TAB.LETTER);

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
          onChangeTab={setActiveTab}
          onPressButton={handlePressBell}
        />
      </SafeAreaView>

      {/* 로그인하지 않았으면 편지 탭은 필터 Tabs 아래에, 우표 탭은 바로 엠티뷰를 보여준다. 작성 FAB 은 남겨 두고 누르면 로그인 안내 Dialog 를 띄운다 */}
      <Animated.View style={[styles.content, tabSwitchStyle]}>
        {activeTab === LETTER_BOX_TAB.LETTER && (
          <LetterSection
            userId={userId}
            isSignedIn={isSignedIn}
            bottomInset={fabHeight}
            onPressLetter={handlePressLetter}
            onPressLogin={handlePressLogin}
          />
        )}
        {activeTab === LETTER_BOX_TAB.STAMP && (
          isSignedIn ? (
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
          )
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
  // FAB 에 가려지는 높이(paddingBottom)를 빼고 가운데에 둔다
  loginEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default LetterBoxScreen;
