import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { padding } from '../../styles/token';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

const getTouchDistance = touches => {
  if (touches.length < 2) return 0;

  const [first, second] = touches;
  const deltaX = second.pageX - first.pageX;
  const deltaY = second.pageY - first.pageY;

  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
};

const normalizeImageSource = imageSource => {
  if (typeof imageSource === 'string') {
    return { uri: imageSource };
  }

  return imageSource;
};

const ImageViewer = ({ imageSource }) => {
  const { width: screenWidth, height: screenHeight } =
    useWindowDimensions();

  const source = useMemo(
    () => normalizeImageSource(imageSource),
    [imageSource],
  );

  const [naturalSize, setNaturalSize] = useState(null);

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const scaleRef = useRef(1);
  const translateXRef = useRef(0);
  const translateYRef = useRef(0);

  const pinchStartDistanceRef = useRef(null);
  const pinchStartScaleRef = useRef(1);
  const panStartTouchRef = useRef(null);
  const panStartTranslationRef = useRef({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    setNaturalSize(null);

    scaleRef.current = 1;
    translateXRef.current = 0;
    translateYRef.current = 0;

    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);

    if (!source) return;

    const resolvedSource = Image.resolveAssetSource(source);

    if (
      resolvedSource?.width > 0 &&
      resolvedSource?.height > 0
    ) {
      setNaturalSize({
        width: resolvedSource.width,
        height: resolvedSource.height,
      });
      return;
    }

    if (!source.uri) return;

    Image.getSize(
      source.uri,
      (width, height) => {
        setNaturalSize({
          width,
          height,
        });
      },
      error => {
        console.warn(
          '이미지 크기를 불러오지 못했습니다.',
          error,
        );
      },
    );
  }, [
    scale,
    source,
    translateX,
    translateY,
  ]);

  const displaySize = useMemo(() => {
    if (!naturalSize) return null;

    const availableWidth =
      screenWidth - padding.L * 2;
    const availableHeight =
      screenHeight - padding.XL * 2;

    const imageRatio =
      naturalSize.width / naturalSize.height;

    const availableRatio =
      availableWidth / availableHeight;

    if (imageRatio > availableRatio) {
      return {
        width: availableWidth,
        height: availableWidth / imageRatio,
      };
    }

    return {
      width: availableHeight * imageRatio,
      height: availableHeight,
    };
  }, [
    naturalSize,
    screenHeight,
    screenWidth,
  ]);

  const displaySizeRef = useRef(displaySize);
  displaySizeRef.current = displaySize;

  const containerStyle = useMemo(() => {
    if (!displaySize) return null;

    return {
      position: 'absolute',
      left: (screenWidth - displaySize.width) / 2,
      top: (screenHeight - displaySize.height) / 2,
      width: displaySize.width,
      height: displaySize.height,
    };
  }, [
    displaySize,
    screenHeight,
    screenWidth,
  ]);

  const setTranslate = (x, y) => {
    const size = displaySizeRef.current;

    if (!size) return;

    const currentScale = scaleRef.current;

    const maxTranslateX =
      (size.width * (currentScale - 1)) / 2;

    const maxTranslateY =
      (size.height * (currentScale - 1)) / 2;

    const nextX = clamp(
      x,
      -maxTranslateX,
      maxTranslateX,
    );

    const nextY = clamp(
      y,
      -maxTranslateY,
      maxTranslateY,
    );

    translateXRef.current = nextX;
    translateYRef.current = nextY;

    translateX.setValue(nextX);
    translateY.setValue(nextY);
  };

  const resetTransform = () => {
    scaleRef.current = 1;
    translateXRef.current = 0;
    translateYRef.current = 0;

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: event => {
          return (
            event.nativeEvent.touches.length >= 2 ||
            scaleRef.current > 1
          );
        },
        onPanResponderGrant: event => {
          const touches = event.nativeEvent.touches;

          if (touches.length >= 2) {
            pinchStartDistanceRef.current =
              getTouchDistance(touches);

            pinchStartScaleRef.current =
              scaleRef.current;

            return;
          }

          const touch = touches[0];

          if (!touch) return;

          panStartTouchRef.current = {
            x: touch.pageX,
            y: touch.pageY,
          };

          panStartTranslationRef.current = {
            x: translateXRef.current,
            y: translateYRef.current,
          };
        },
        onPanResponderMove: event => {
          const touches = event.nativeEvent.touches;

          if (touches.length >= 2) {
            const distance =
              getTouchDistance(touches);

            if (!pinchStartDistanceRef.current) {
              pinchStartDistanceRef.current =
                distance;

              pinchStartScaleRef.current =
                scaleRef.current;

              return;
            }

            const nextScale = clamp(
              pinchStartScaleRef.current *
              (distance /
                pinchStartDistanceRef.current),
              MIN_SCALE,
              MAX_SCALE,
            );

            scaleRef.current = nextScale;
            scale.setValue(nextScale);

            setTranslate(
              translateXRef.current,
              translateYRef.current,
            );

            return;
          }

          if (
            touches.length !== 1 ||
            scaleRef.current <= 1
          ) {
            return;
          }

          const touch = touches[0];

          if (!panStartTouchRef.current) {
            panStartTouchRef.current = {
              x: touch.pageX,
              y: touch.pageY,
            };

            panStartTranslationRef.current = {
              x: translateXRef.current,
              y: translateYRef.current,
            };

            return;
          }

          const deltaX =
            touch.pageX -
            panStartTouchRef.current.x;

          const deltaY =
            touch.pageY -
            panStartTouchRef.current.y;

          setTranslate(
            panStartTranslationRef.current.x +
            deltaX,
            panStartTranslationRef.current.y +
            deltaY,
          );
        },
        onPanResponderRelease: () => {
          pinchStartDistanceRef.current = null;
          panStartTouchRef.current = null;

          if (scaleRef.current <= 1) {
            resetTransform();
            return;
          }

          setTranslate(
            translateXRef.current,
            translateYRef.current,
          );
        },
        onPanResponderTerminate: () => {
          pinchStartDistanceRef.current = null;
          panStartTouchRef.current = null;

          if (scaleRef.current <= 1) {
            resetTransform();
          }
        },
      }),
    [
      scale,
      translateX,
      translateY,
    ],
  );

  if (!source || !displaySize || !containerStyle) {
    return null;
  }

  return (
    <View
      {...panResponder.panHandlers}
      style={containerStyle}
    >
      <Animated.Image
        source={source}
        resizeMode="contain"
        style={[
          styles.image,
          {
            width: displaySize.width,
            height: displaySize.height,
            transform: [
              { translateX },
              { translateY },
              { scale },
            ],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
  },
});

export default memo(ImageViewer);