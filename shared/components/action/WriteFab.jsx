import React, { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import FAB, { FAB_EXPAND_DURATION } from './FAB';
import {
  useBottomNavigationHeight,
  useBottomNavigationWindowTop,
} from '../navigation/bottomnavigation/BottomNavigation';
import { useGlobalOverlay } from '../../providers/GlobalOverlayProvider';
import { colors } from '../../styles/color';
import { gap, padding } from '../../styles/token';

// 레이아웃 측정 전 사용할 예상 높이
// (padding.L * 2 + 텍스트 lineHeight + FAB 자체 배경의 상하 padding + 회색 배경 박스의 상하 padding.M)
export const DEFAULT_WRITE_FAB_HEIGHT = padding.L * 2 + 17 + gap.M * 2 + padding.M * 2;

// 회색 배경의 아래쪽 절반은 solid, 위쪽 절반은 투명 → solid 그라데이션 (locations로 한 레이어에서 처리)
const BACKGROUND_GRADIENT_COLORS = ['rgba(241, 242, 244, 0)', colors.bgLayerBasement, colors.bgLayerBasement];
const BACKGROUND_GRADIENT_LOCATIONS = [0, 0.5, 1];

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

/**
 * 화면 하단에 떠 있는 작성 FAB (편지 작성 / 피드 작성).
 * 열리면 Dim이 BottomNavigation까지 덮도록 전역 오버레이(WindowOverlay)로 옮겨 렌더링한다.
 *
 * @param {object} navigation 작성 화면(Record)으로 이동할 navigation
 * @param {string} [expandedLabel] 열렸을 때 기본 버튼 문구 (화면마다 다르게 지정)
 * @param {(height: number) => void} [onHeightChange] 목록 하단 여백 계산용 FAB 영역 높이
 */
const WriteFab = ({ navigation, expandedLabel, onHeightChange }) => {
  const overlayId = `write-fab-${useId()}`;
  const bottomNavigationHeight = useBottomNavigationHeight();
  const bottomNavigationWindowTop = useBottomNavigationWindowTop();
  const frame = useSafeAreaFrame();
  const { openOverlay, closeOverlay } = useGlobalOverlay();

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

  const navigateToRecord = useCallback(type => {
    closeOverlay(overlayId);
    setIsOpen(false);
    navigation.navigate('Record', { type });
  }, [closeOverlay, navigation, overlayId]);

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

  if (isOpen) {
    // 오버레이로 옮겨간 동안 화면 쪽에는 배경만 남겨 목록이 비치지 않게 한다
    return (
      <LinearGradient
        colors={BACKGROUND_GRADIENT_COLORS}
        locations={BACKGROUND_GRADIENT_LOCATIONS}
        style={[styles.fabBackground, { height }]}
      />
    );
  }

  return (
    <LinearGradient
      colors={BACKGROUND_GRADIENT_COLORS}
      locations={BACKGROUND_GRADIENT_LOCATIONS}
      style={styles.fabBackground}
      onLayout={handleLayout}
    >
      <FAB open={false} onOpenChange={handleOpen} />
    </LinearGradient>
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
  overlayContent: {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});

export default memo(WriteFab);
