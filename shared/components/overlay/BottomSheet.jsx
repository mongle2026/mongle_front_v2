import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';

import GorhomBottomSheet, {
  BottomSheetFlatList as GorhomBottomSheetFlatList,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  colors,
  shadow,
} from '../../styles/color';
import {
  padding,
  gap,
  radius,
} from '../../styles/token';

const DEFAULT_HEIGHT = 720;

// gorhom의 스크롤 가능 컴포넌트(BottomSheetFlatList 등)는 Android에서
// flex만으로 높이를 잡으면 제스처/스크롤 연동이 제대로 안 잡히는
// 알려진 회귀 버그가 있습니다.
// (https://github.com/gorhom/react-native-bottom-sheet/issues/2311)
// 명시적인 maxHeight를 주면 우회됩니다 — 실제 보이는 높이는 여전히
// flex:1이 정하고, maxHeight는 절대 넘지 않을 만큼 넉넉한 상한선만
// 줍니다.
const MAX_LIST_HEIGHT =
  Dimensions.get('window').height;

/**
 * BottomSheet의 children으로 넣는 FlatList입니다.
 * 리스트가 맨 위(top)에서 딱 멈추고, 그 상태에서 이어서 당기면
 * 시트가 드래그로 닫히는 처리가 (Android 포함) 기본으로 되어 있습니다.
 *
 * data가 react-query 캐시 등으로 마운트와 "동시에" 채워져 있으면
 * (예: 시트를 한 번 닫았다 다시 열었을 때) gorhom이 스크롤 연동을
 * 제대로 못 잡는 경우가 있습니다. 처음 로딩될 때(데이터가 나중에
 * 비동기로 채워질 때)는 문제가 없어서, 마운트 첫 프레임엔 항상
 * 빈 배열을 주고 실제 data로 바꿔서 이 타이밍을 인위적으로
 * 맞춰줍니다.
 *
 * useEffect 한 틱만으로는 gorhom 내부 초기화가 아직 안 끝난
 * 경우가 있어서(기기 성능에 따라 들쭉날쭉하게 재현됨) 두 번의
 * requestAnimationFrame으로 실제 화면이 최소 한 프레임 이상
 * 그려진 뒤에 데이터를 채우도록 넉넉하게 미룹니다.
 */
export const BottomSheetFlatList = ({
  style,
  data,
  ...props
}) => {
  const [isReady, setIsReady] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GorhomBottomSheetFlatList
      style={[
        styles.list,
        style,
      ]}
      data={
        isReady ? data : []
      }
      {...props}
    />
  );
};

const DragHandle = () => (
  <View style={styles.dragHandleTouchArea}>
    <View style={styles.dragHandle}>
      <View style={styles.dragHandleShape} />
    </View>
  </View>
);

const BottomSheet = ({
  children,
  height = DEFAULT_HEIGHT,
  fitContent = false,
  onClose,
  showDragHandle = true,
  style,
}) => {
  const insets = useSafeAreaInsets();

  // Android에서는 Dimensions.get('window')가 하단 내비게이션 바
  // 높이를 제외한 값을 반환할 수 있어, 시트가 실제로 놓이는 전체
  // 화면 높이인 Dimensions.get('screen')을 기준으로 계산합니다.
  const { height: screenHeight } =
    Dimensions.get('screen');

  // 콘텐츠(+ 아래 추가하는 안전영역 스페이서)가 상태바/내비게이션
  // 바 영역까지 침범하지 않도록 상한을 둡니다.
  const maxFitContentHeight =
    screenHeight -
    insets.top -
    insets.bottom;

  const snapPoints = useMemo(
    () =>
      fitContent ? undefined : [height],
    [fitContent, height],
  );

  // BottomSheetView는 마운트되면 스스로를 "현재 스크롤 가능한
  // 컴포넌트"로 등록합니다(dynamic sizing 측정을 위해 필요).
  // 근데 그 안에 BottomSheetFlatList가 함께 있으면, 나중에
  // 마운트되는 BottomSheetView가 FlatList의 등록을 덮어써버려서
  // 시트가 리스트를 "스크롤 안 되는 View"로 착각해 스크롤이
  // 먹통이 됩니다. 그래서 리스트가 있는 고정 높이 모드에서는
  // 일반 View를, 스크롤 리스트가 없는 fitContent 모드에서만
  // BottomSheetView를 씁니다.
  const ContentWrapper = fitContent
    ? BottomSheetView
    : View;

  return (
    <GorhomBottomSheet
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={fitContent}
      maxDynamicContentSize={
        fitContent
          ? maxFitContentHeight
          : undefined
      }
      topInset={insets.top}
      enablePanDownToClose
      onClose={onClose}
      handleComponent={
        showDragHandle
          ? DragHandle
          : null
      }
      backgroundStyle={styles.background}
      style={[styles.container, style]}
    >
      <ContentWrapper
        style={[
          styles.content,

          fitContent
            ? styles.fitContent
            : styles.fixedContent,

          !fitContent && {
            paddingBottom:
              insets.bottom +
              padding.XS,
          },
        ]}
      >
        {children}

        {/*
          gorhom의 enableDynamicSizing은 컨테이너에 준
          paddingBottom을 콘텐츠 높이 계산에 반영하지 않습니다
          (실측 결과 paddingBottom 값을 아무리 키워도 시트 높이가
          전혀 변하지 않음 - Android 하단 내비게이션 바와 겹치는
          원인). 자식 엘리먼트로 실제 높이를 차지하는 View를 넣어야
          측정에 반영됩니다.
        */}
        {fitContent && (
          <View
            style={{
              height:
                insets.bottom +
                padding.XS,
            }}
          />
        )}
      </ContentWrapper>
    </GorhomBottomSheet>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: radius.M,
    borderTopRightRadius: radius.M,

    ...shadow.middleUp,
  },

  list: {
    flex: 1,
    maxHeight: MAX_LIST_HEIGHT,
  },

  background: {
    borderTopLeftRadius: radius.M,
    borderTopRightRadius: radius.M,

    backgroundColor:
      colors.bgLayerDefault,
  },

  dragHandleTouchArea: {
    width: '100%',
    minHeight: 28,

    paddingTop: padding.XS,

    justifyContent: 'center',
    alignItems: 'center',
  },

  dragHandle: {
    width: '100%',

    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',

    gap: gap.M,
  },

  dragHandleShape: {
    width: 80,
    height: 4,

    borderRadius: radius.M,

    backgroundColor:
      colors.fgNeutralFaint,
  },

  content: {
    width: '100%',
  },

  fixedContent: {
    flex: 1,
  },

  fitContent: {
    flex: 0,
  },
});
