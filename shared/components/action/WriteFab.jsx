import React, { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import FAB, { FAB_EXPAND_DURATION } from './FAB';
import Coachmark from '../feedback/Coachmark';
import {
  useBottomNavigationHeight,
  useBottomNavigationWindowTop,
} from '../navigation/bottomnavigation/BottomNavigation';
import { useGlobalOverlay } from '../../providers/GlobalOverlayProvider';
import useLoginDialog, { LOGIN_DIALOG_DESCRIPTION } from '../../hooks/useLoginDialog';
import { colors } from '../../styles/color';
import { gap, padding } from '../../styles/token';

// 레이아웃 측정 전 사용할 예상 높이
// (padding.L * 2 + 텍스트 lineHeight + FAB 자체 배경의 상하 padding + 회색 배경 박스의 상하 padding.M)
export const DEFAULT_WRITE_FAB_HEIGHT = padding.L * 2 + 17 + gap.M * 2 + padding.M * 2;

// FAB 영역(위아래 padding.M 포함) 맨 위에서 FAB 의 세로 중앙까지 투명 → bgBase 로 페이드하고,
// FAB 중앙 아래는 bgBase 단색. 영역이 FAB 기준 위아래 대칭이라 영역의 절반 = FAB 중앙이다
const FADE_COLORS = [colors.bgBase0, colors.bgBase];

// FAB 영역 배경: 위 절반은 그라데이션, 아래 절반은 단색
const FabBackground = () => (
  <>
    <LinearGradient
      pointerEvents="none"
      colors={FADE_COLORS}
      style={styles.fade}
    />
    <View pointerEvents="none" style={styles.solid} />
  </>
);

// 전역 오버레이 안에 렌더링되는 열린 상태의 FAB.
// 닫기 요청이 오면 먼저 FAB를 닫아 expandedRow가 기본 버튼 뒤로 내려가는 애니메이션을 보여주고,
// 애니메이션이 끝난 뒤 onClosed로 오버레이를 제거한다. Dim은 onCloseStart로 같이 페이드 아웃한다.
const WriteFabOverlayContent = memo(({
  expandedLabel,
  bottomInset,
  onCloseStart,
  onClosed,
  onFeedPress,
  onLetterPress,
}) => {
  const [open, setOpen] = useState(true);
  const closeTimerRef = useRef(null);

  const requestClose = useCallback(() => {
    if (closeTimerRef.current) return;

    setOpen(false);
    onCloseStart?.();
    closeTimerRef.current = setTimeout(onClosed, FAB_EXPAND_DURATION);
  }, [onCloseStart, onClosed]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestClose();
      return true;
    });

    return () => subscription.remove();
  }, [requestClose]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  const handleOpenChange = useCallback(nextOpen => {
    if (!nextOpen) requestClose();
  }, [requestClose]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="작성 메뉴 닫기"
        onPress={requestClose}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.fabBackground, { marginBottom: bottomInset }]}>
        <FAB
          open={open}
          expandedLabel={expandedLabel}
          closeOnActionPress={false}
          onOpenChange={handleOpenChange}
          onFeedPress={onFeedPress}
          onLetterPress={onLetterPress}
        />
      </View>
    </>
  );
});

WriteFabOverlayContent.displayName = 'WriteFabOverlayContent';

// 전역 오버레이 안에 렌더링되는 코치마크 안내.
// 단계마다 FAB 를 닫힌(open: false) · 펼친(open: true) 채로 보여 주고, 그 FAB 의 맨 윗줄에서 gap.M 위 가운데에 코치마크를 띄운다.
// 화면 어디를 눌러도(FAB 포함) 다음 단계로 넘어가고, 마지막 단계에서 누르면 FAB 를 닫으며 Dim 과 같이 사라진다.
const WriteFabCoachmarkContent = memo(({
  coachmarks,
  expandedLabel,
  bottomInset,
  onCloseStart,
  onClosed,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef(null);

  const step = coachmarks[stepIndex];
  const isLastStep = stepIndex === coachmarks.length - 1;

  const handlePress = useCallback(() => {
    if (closeTimerRef.current) return;

    if (!isLastStep) {
      setStepIndex(stepIndex + 1);
      return;
    }

    setIsClosing(true);
    onCloseStart?.();
    closeTimerRef.current = setTimeout(onClosed, FAB_EXPAND_DURATION);
  }, [isLastStep, onCloseStart, onClosed, stepIndex]);

  // 뒤로가기도 화면을 누른 것처럼 다음 단계로 넘긴다
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handlePress();
      return true;
    });

    return () => subscription.remove();
  }, [handlePress]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isLastStep ? '안내 닫기' : '다음 안내 보기'}
        onPress={handlePress}
        style={StyleSheet.absoluteFill}
      />

      {/* FAB 는 눌리지 않고 뒤의 Pressable 로 터치가 넘어가게 한다 */}
      <View pointerEvents="none" style={[styles.fabBackground, { marginBottom: bottomInset }]}>
        <View>
          {!isClosing && (
            <View style={styles.coachmark}>
              <Coachmark
                title={step.title}
                body={step.body}
                arrowPosition="bottom"
                arrowAlign="center"
              />
            </View>
          )}

          <FAB open={!isClosing && step.open} expandedLabel={expandedLabel} />
        </View>
      </View>
    </>
  );
});

WriteFabCoachmarkContent.displayName = 'WriteFabCoachmarkContent';

/**
 * 화면 하단에 떠 있는 작성 FAB (편지 작성 / 피드 작성).
 * 열리면 Dim이 BottomNavigation까지 덮도록 전역 오버레이(WindowOverlay)로 옮겨 렌더링한다.
 *
 * @param {object} navigation 작성 화면(Record)으로 이동할 navigation
 * @param {string} [expandedLabel] 열렸을 때 기본 버튼 문구 (화면마다 다르게 지정)
 * @param {(height: number) => void} [onHeightChange] 목록 하단 여백 계산용 FAB 영역 높이
 * @param {{ title: string, body: string, open: boolean }[]} [coachmarks]
 *   넘기면 FAB 코치마크 안내를 띄운다. open 은 그 단계에서 FAB 를 펼칠지. 마운트된 동안 한 번만 띄운다
 * @param {() => void} [onCoachmarkEnd] 코치마크 안내가 닫혔을 때
 */
const WriteFab = ({
  navigation,
  expandedLabel,
  onHeightChange,
  coachmarks,
  onCoachmarkEnd,
}) => {
  const overlayId = `write-fab-${useId()}`;
  const bottomNavigationHeight = useBottomNavigationHeight();
  const bottomNavigationWindowTop = useBottomNavigationWindowTop();
  const frame = useSafeAreaFrame();
  const { openOverlay, closeOverlay } = useGlobalOverlay();
  const { requireLogin } = useLoginDialog();

  /*
   * 닫힌 FAB 는 화면(탭 네비게이터의 scene) 안에서 bottom: 0,
   * 열린 FAB 는 전역 오버레이(루트 전체) 안에서 bottom: 0 이라
   * 두 기준선이 Android 에서 시스템 내비게이션 바만큼 어긋난다.
   *
   * scene 의 아래 끝 = BottomNavigation 의 윗변이므로,
   * 오버레이 아래 끝(frame.y + frame.height)에서 그 지점까지의 거리를
   * marginBottom 으로 주면 FAB 가 눌린 자리에 그대로 머문다.
   * 측정 전(첫 프레임)에는 BottomNavigation 높이로 대신한다.
   */
  const overlayBottomInset = bottomNavigationWindowTop > 0
    ? Math.max(0, frame.y + frame.height - bottomNavigationWindowTop)
    : bottomNavigationHeight;

  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(DEFAULT_WRITE_FAB_HEIGHT);

  useEffect(() => {
    onHeightChange?.(height);
  }, [height, onHeightChange]);

  // 열린 채로 화면이 언마운트되면 오버레이가 남지 않도록 정리
  useEffect(() => () => closeOverlay(overlayId), [closeOverlay, overlayId]);

  const handleLayout = useCallback(event => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setHeight(currentHeight => (currentHeight === nextHeight ? currentHeight : nextHeight));
  }, []);

  const handleClosed = useCallback(() => {
    closeOverlay(overlayId);
    setIsOpen(false);
  }, [closeOverlay, overlayId]);

  // 로그인하지 않았으면 메뉴를 닫고 작성 화면 대신 로그인 안내 Dialog 를 띄운다
  const navigateToRecord = useCallback(type => {
    closeOverlay(overlayId);
    setIsOpen(false);

    const description = type === 'letter'
      ? LOGIN_DIALOG_DESCRIPTION.WRITE_LETTER
      : LOGIN_DIALOG_DESCRIPTION.WRITE_FEED;
    if (!requireLogin(description)) return;

    navigation.navigate('Record', { type });
  }, [closeOverlay, navigation, overlayId, requireLogin]);

  const handleFeedPress = useCallback(() => navigateToRecord('feed'), [navigateToRecord]);
  const handleLetterPress = useCallback(() => navigateToRecord('letter'), [navigateToRecord]);

  const renderOverlayContent = useCallback(({ hideDim }) => (
    <WriteFabOverlayContent
      expandedLabel={expandedLabel}
      bottomInset={overlayBottomInset}
      onCloseStart={hideDim}
      onClosed={handleClosed}
      onFeedPress={handleFeedPress}
      onLetterPress={handleLetterPress}
    />
  ), [overlayBottomInset, expandedLabel, handleClosed, handleFeedPress, handleLetterPress]);

  // isOpen 변경에 반응하는 useEffect로 openOverlay를 호출하면 커밋이 한 프레임
  // 늦게 일어나서(로컬 상태 변경 → effect 실행 → 상위 Provider 리렌더) 그 사이에
  // 로컬 FAB는 이미 사라졌는데 오버레이 쪽 FAB/Dim은 아직 안 뜬 프레임이 생겨
  // 버튼이 팝업처럼 튀어 보인다. 그래서 사용자가 실제로 누른 그 이벤트 핸들러
  // 안에서 isOpen 변경과 openOverlay 호출을 같이 해서 같은 커밋에 배치되게 한다.
  const handleOpen = useCallback(() => {
    setIsOpen(true);

    openOverlay({
      id: overlayId,
      accessibilityLabel: '작성 메뉴 닫기',
      // Dim/뒤로가기로 닫을 때도 expandedRow 퇴장 애니메이션을 보여주기 위해 WriteFabOverlayContent에서 직접 처리
      closeOnDimPress: false,
      closeOnBackPress: false,
      contentContainerStyle: styles.overlayContent,
      onClose: () => setIsOpen(false),
      renderContent: renderOverlayContent,
    });
  }, [openOverlay, overlayId, renderOverlayContent]);

  const onCoachmarkEndRef = useRef(onCoachmarkEnd);
  useEffect(() => {
    onCoachmarkEndRef.current = onCoachmarkEnd;
  });

  const hasShownCoachmarkRef = useRef(false);

  // 안내를 끝까지 봤을 때뿐 아니라 다른 오버레이가 덮어쓰거나 화면이 언마운트될 때도 불린다
  const handleCoachmarkClose = useCallback(() => {
    setIsOpen(false);
    onCoachmarkEndRef.current?.();
  }, []);

  const handleCoachmarkClosed = useCallback(() => {
    closeOverlay(overlayId);
  }, [closeOverlay, overlayId]);

  // 오버레이 쪽 FAB 가 닫힌 FAB 자리에 그대로 오도록 BottomNavigation 위치가 측정된 뒤에 띄운다
  const canShowCoachmark = Boolean(coachmarks?.length) && bottomNavigationWindowTop > 0;

  useEffect(() => {
    if (!canShowCoachmark || hasShownCoachmarkRef.current) return;
    hasShownCoachmarkRef.current = true;

    // handleOpen 과 같이 isOpen 변경과 openOverlay 를 한 커밋에 배치한다
    setIsOpen(true);

    openOverlay({
      id: overlayId,
      accessibilityLabel: '안내 닫기',
      closeOnDimPress: false,
      closeOnBackPress: false,
      contentContainerStyle: styles.overlayContent,
      onClose: handleCoachmarkClose,
      renderContent: ({ hideDim }) => (
        <WriteFabCoachmarkContent
          coachmarks={coachmarks}
          expandedLabel={expandedLabel}
          bottomInset={overlayBottomInset}
          onCloseStart={hideDim}
          onClosed={handleCoachmarkClosed}
        />
      ),
    });
  }, [
    canShowCoachmark,
    coachmarks,
    expandedLabel,
    handleCoachmarkClose,
    handleCoachmarkClosed,
    openOverlay,
    overlayBottomInset,
    overlayId,
  ]);

  if (isOpen) {
    // 오버레이로 옮겨간 동안 화면 쪽에는 배경만 남겨 목록이 비치지 않게 한다
    return (
      <View pointerEvents="none" style={[styles.fabBackground, { height }]}>
        <FabBackground />
      </View>
    );
  }

  return (
    <View
      style={styles.fabBackground}
      onLayout={handleLayout}
    >
      <FabBackground />
      <FAB open={false} onOpenChange={handleOpen} />
    </View>
  );
};

const styles = StyleSheet.create({
  fabBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: padding.M,
    zIndex: 20,
    elevation: 20,
  },
  fade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  solid: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bgBase,
  },
  // FAB(펼쳤으면 피드 작성 · 편지 작성 줄) 윗변에서 gap.M 위, 가운데
  coachmark: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    paddingBottom: gap.M,
    alignItems: 'center',
  },
  overlayContent: {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});

export default memo(WriteFab);
