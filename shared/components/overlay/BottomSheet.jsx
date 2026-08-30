import React, {
  useEffect,
  useState,
} from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';

import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

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

const CLOSE_DISTANCE_RATIO = 0.25;
const CLOSE_VELOCITY = 1000;

const SCREEN_HEIGHT =
  Dimensions.get('window').height;

const BottomSheet = ({
  children,
  height = DEFAULT_HEIGHT,
  fitContent = false,
  onClose,
  showDragHandle = true,
  style,
}) => {
  const insets = useSafeAreaInsets();

  const [measuredHeight, setMeasuredHeight] =
    useState(0);

  const translateY = useSharedValue(
    fitContent
      ? SCREEN_HEIGHT
      : height,
  );

  const dragStartY =
    useSharedValue(0);

  useEffect(() => {
    if (
      fitContent &&
      measuredHeight === 0
    ) {
      return;
    }

    translateY.value = withTiming(0, {
      duration: 220,
    });
  }, [
    fitContent,
    height,
    measuredHeight,
    translateY,
  ]);

  const closeBottomSheet = () => {
    onClose?.();
  };

  const sheetHeight = fitContent
    ? measuredHeight
    : height;

  const closeDistance =
    sheetHeight > 0
      ? sheetHeight
      : SCREEN_HEIGHT;

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      dragStartY.value =
        translateY.value;
    })
    .onUpdate(event => {
      const nextTranslateY =
        dragStartY.value +
        event.translationY;

      translateY.value = Math.max(
        0,
        nextTranslateY,
      );
    })
    .onEnd(event => {
      const shouldClose =
        translateY.value >
          closeDistance *
            CLOSE_DISTANCE_RATIO ||
        event.velocityY >
          CLOSE_VELOCITY;

      if (shouldClose) {
        translateY.value =
          withTiming(
            closeDistance,
            {
              duration: 180,
            },
            finished => {
              if (
                finished &&
                onClose
              ) {
                runOnJS(
                  closeBottomSheet,
                )();
              }
            },
          );

        return;
      }

      translateY.value =
        withSpring(0, {
          damping: 22,
          stiffness: 220,
          mass: 0.8,
        });
    });

  const animatedStyle =
    useAnimatedStyle(() => ({
      transform: [
        {
          translateY:
            translateY.value,
        },
      ],
    }));

  return (
    <Animated.View
      onLayout={
        fitContent
          ? event => {
              setMeasuredHeight(
                event.nativeEvent.layout
                  .height,
              );
            }
          : undefined
      }
      style={[
        styles.container,

        fitContent
          ? {
              maxHeight:
                SCREEN_HEIGHT -
                insets.top,
            }
          : {
              height,
            },

        animatedStyle,
        style,
      ]}
    >
      {showDragHandle && (
        <GestureDetector
          gesture={panGesture}
        >
          <View
            style={
              styles.dragHandleTouchArea
            }
          >
            <View
              style={
                styles.dragHandle
              }
            >
              <View
                style={
                  styles.dragHandleShape
                }
              />
            </View>
          </View>
        </GestureDetector>
      )}

      <View
        style={[
          styles.content,

          fitContent &&
            styles.fitContent,

          {
            paddingBottom:
              insets.bottom,
          },
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  container: {
    width: '100%',

    paddingVertical: padding.XS,

    flexDirection: 'column',
    alignItems: 'center',

    borderTopLeftRadius: radius.M,
    borderTopRightRadius: radius.M,

    backgroundColor:
      colors.bgLayerDefault,

    ...shadow.middleUp,
  },

  dragHandleTouchArea: {
    width: '100%',
    minHeight: 28,

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
    flex: 1,
    width: '100%',
  },

  fitContent: {
    flex: 0,
  },
});