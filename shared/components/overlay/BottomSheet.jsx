import React, { useEffect } from 'react';
import { StyleSheet, View, } from 'react-native';
import { Gesture, GestureDetector, } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, } from 'react-native-reanimated';

import { colors, shadow } from '../../styles/color';

const DEFAULT_HEIGHT = 720;

const CLOSE_DISTANCE_RATIO = 0.25;
const CLOSE_VELOCITY = 1000;

const BottomSheet = ({
  children,
  height = DEFAULT_HEIGHT,
  onClose,
  showDragHandle = true,
  style,
}) => {
  const translateY = useSharedValue(height);
  const dragStartY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 220,
    });
  }, [height, translateY]);

  const closeBottomSheet = () => {
    if (onClose) {
      onClose();
    }
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextTranslateY =
        dragStartY.value + event.translationY;

      // 위로는 올라가지 않고 아래 방향으로만 드래그
      translateY.value = Math.max(
        0,
        nextTranslateY,
      );
    })
    .onEnd((event) => {
      const shouldClose =
        translateY.value >
        height * CLOSE_DISTANCE_RATIO ||
        event.velocityY > CLOSE_VELOCITY;

      if (shouldClose) {
        translateY.value = withTiming(
          height,
          {
            duration: 180,
          },
          (finished) => {
            if (
              finished &&
              onClose
            ) {
              runOnJS(closeBottomSheet)();
            }
          },
        );

        return;
      }

      translateY.value = withSpring(
        0,
        {
          damping: 22,
          stiffness: 220,
          mass: 0.8,
        },
      );
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
      style={[
        styles.container,
        {
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

      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  container: {
    width: '100%',

    paddingVertical: 4,

    flexDirection: 'column',
    alignItems: 'center',

    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,

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

    gap: 8,
  },

  dragHandleShape: {
    width: 80,
    height: 4,

    borderRadius: 6,

    backgroundColor:
      colors.fgNeutralFaint,
  },

  content: {
    flex: 1,
    width: '100%',
  },
});