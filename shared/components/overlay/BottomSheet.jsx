import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

// DragHandle 영역 높이. snapPoints는 이 영역까지 포함한 시트 높이라,
// 콘텐츠 높이에 맞춰 snapPoint를 계산할 때 더해줍니다.
export const DRAG_HANDLE_HEIGHT = 28;

// gorhom의 스크롤 가능 컴포넌트(BottomSheetFlatList 등)는 Android에서
// flex만으로 높이를 잡으면 제스처/스크롤 연동이 제대로 안 잡히는
// 알려진 회귀 버그가 있습니다.
// (https://github.com/gorhom/react-native-bottom-sheet/issues/2311)
// 명시적인 maxHeight를 주면 우회됩니다 — 실제 보이는 높이는 여전히
// flex:1이 정하고, maxHeight는 절대 넘지 않을 만큼 넉넉한 상한선만
// 줍니다.
const MAX_LIST_HEIGHT =
  Dimensions.get('window').height;

// 시트 콘텐츠(리스트 data)를 채워도 되는 시점인지 알려주는 context.
// BottomSheet 밖에서 쓰면 바로 채웁니다.
const BottomSheetContentReadyContext =
  createContext(true);

// 시트를 연 뒤 레이아웃 계산이 늦어 snapToIndex가 무시될 때
// 다시 시도할 최대 프레임 수 (약 1초)
const MAX_OPEN_ATTEMPTS = 60;

/**
 * BottomSheet의 children으로 넣는 FlatList입니다.
 * 리스트가 맨 위(top)에서 딱 멈추고, 그 상태에서 이어서 당기면
 * 시트가 드래그로 닫히는 처리가 (Android 포함) 기본으로 되어 있습니다.
 *
 * data가 react-query 캐시 등으로 마운트와 "동시에" 채워져 있으면
 * (예: 시트를 한 번 닫았다 다시 열었을 때) gorhom이 스크롤 연동을
 * 제대로 못 잡는 경우가 있습니다. 그래서 마운트 첫 프레임엔 항상
 * 빈 배열을 주고, BottomSheet가 gorhom 내부 초기화를 기다린 뒤
 * (두 번의 requestAnimationFrame) 알려주면 실제 data로 바꿉니다.
 *
 * 시트는 이 data까지 그려진 뒤에 올라가기 시작하므로, 리스트 행이
 * 마운트되는 비용이 올라가는 애니메이션 프레임과 겹치지 않습니다.
 */
export const BottomSheetFlatList = ({
  style,
  data,
  ...props
}) => {
  const isContentReady = useContext(
    BottomSheetContentReadyContext,
  );

  return (
    <GorhomBottomSheetFlatList
      style={[
        styles.list,
        style,
      ]}
      data={
        isContentReady ? data : []
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

// snapPoints: 여러 높이로 멈추게 할 때 사용 (예: [처음 높이, '100%']).
// 주면 height는 무시되고, 처음에는 snapPoints[0]로 뜹니다.
// animatedIndex: 시트의 현재 위치를 snapPoint index로 받는 SharedValue
// (예: 0.5 = 0번과 1번 사이). 드래그 중에도 실제 위치를 따라갑니다.
// footerComponent: 시트의 보이는 하단에 붙어 다니는 요소 (gorhom BottomSheetFooter로 감싸서 넘깁니다)
// ready: false인 동안은 닫힌 위치에서 콘텐츠만 미리 그려두고 올라가지 않습니다.
// (예: 데이터를 불러와 높이가 정해진 뒤에 열어서, 올라가는 도중 높이가 바뀌지 않게)
const BottomSheet = ({
  ready = true,
  children,
  height = DEFAULT_HEIGHT,
  snapPoints: snapPointsProp,
  fitContent = false,
  onClose,
  animatedIndex,
  footerComponent,
  showDragHandle = true,
  style,
  activeOffsetY,
  failOffsetX,
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
    () => {
      if (fitContent) return undefined;
      return snapPointsProp ?? [height];
    },
    [fitContent, height, snapPointsProp],
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

  const sheetRef = useRef(null);
  const hasStartedOpeningRef =
    useRef(false);

  // 마운트 직후에는 gorhom 내부 초기화가 끝나지 않아서
  // 리스트 data는 두 프레임 뒤에 채웁니다. (BottomSheetFlatList 참고)
  const [isContentReady, setIsContentReady] =
    useState(false);

  useEffect(() => {
    let frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(() => {
        setIsContentReady(true);
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  // 시트는 닫힌 위치(index -1)에 마운트해 콘텐츠를 먼저 다 그린 뒤,
  // 그 다음 프레임부터 올립니다. 마운트/레이아웃 비용이
  // 올라가는 애니메이션과 겹치면 프레임이 끊기기 때문입니다.
  // gorhom은 레이아웃 계산 전에 snapToIndex를 부르면 조용히
  // 무시하므로, 올라가기 시작할 때까지 프레임마다 다시 시도합니다.
  useEffect(() => {
    if (
      !ready ||
      !isContentReady ||
      hasStartedOpeningRef.current
    ) {
      return undefined;
    }

    let attempts = 0;
    let frameId;

    const tryOpen = () => {
      if (
        hasStartedOpeningRef.current ||
        attempts >= MAX_OPEN_ATTEMPTS
      ) {
        return;
      }

      attempts += 1;
      sheetRef.current?.snapToIndex(0);
      frameId =
        requestAnimationFrame(tryOpen);
    };

    frameId =
      requestAnimationFrame(tryOpen);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [ready, isContentReady]);

  const handleAnimate = useCallback(
    (fromIndex, toIndex) => {
      if (toIndex >= 0) {
        hasStartedOpeningRef.current =
          true;
      }
    },
    [],
  );

  return (
    <BottomSheetContentReadyContext.Provider
      value={isContentReady}
    >
      <GorhomBottomSheet
        ref={sheetRef}
        index={-1}
        onAnimate={handleAnimate}
        snapPoints={snapPoints}
        enableDynamicSizing={fitContent}
        maxDynamicContentSize={
          fitContent
            ? maxFitContentHeight
            : undefined
        }
        topInset={insets.top}
        enablePanDownToClose
        // content 전체를 내려서 닫을 수 있게 하면서(enablePanDownToClose)도
        // 가로로 스와이프하는 내부 콘텐츠(예: Calendar)가 있는 경우
        // 세로 제스처가 먼저 선점해버릴 수 있어, 필요한 곳에서만
        // 방향 임계값을 좁혀 넘겨줄 수 있게 pass-through 합니다.
        activeOffsetY={activeOffsetY}
        failOffsetX={failOffsetX}
        onClose={onClose}
        animatedIndex={animatedIndex}
        footerComponent={footerComponent}
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
    </BottomSheetContentReadyContext.Provider>
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
    minHeight: DRAG_HANDLE_HEIGHT,

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
