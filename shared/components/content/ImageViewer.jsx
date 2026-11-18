import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image as CachedImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { padding } from '../../styles/token';
import { IMAGE_CACHE_POLICY, toImageSource } from '../../utils/media';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
// 세로로 긴 사진이 노치 · 홈 인디케이터에 붙지 않도록 세이프 에어리어 바깥으로 더 띄우는 여백
const VERTICAL_MARGIN = 40;

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

// 원본 크기를 아직 모를 때 먼저 띄워 두는 비율 (WriteImg 기본값과 같은 4:3)
const FALLBACK_SIZE = Object.freeze({ width: 4, height: 3 });

const isValidSize = size => size?.width > 0 && size?.height > 0;

/*
 * initialSize: 원본 크기를 이미 알면 넘긴다(상세 화면에서 읽어 둔 값).
 * 크기를 다시 받느라 기다리지 않고 바로 띄우고,
 * 모르면 기본 비율로 먼저 띄운 뒤 사진이 다 받아지면(onLoad) 실제 비율로 맞춘다.
 */
const ImageViewer = ({ imageSource, initialSize }) => {
  const { width: screenWidth, height: screenHeight } =
    useWindowDimensions();
  const insets = useSafeAreaInsets();

  const source = useMemo(
    () => toImageSource(imageSource),
    [imageSource],
  );

  // onLoad 로 알아낸 크기. 다른 사진으로 바뀌면 무시하도록 source 와 같이 기억한다
  const [loadedSize, setLoadedSize] = useState(null);

  const knownSize = useMemo(() => {
    if (!source) return null;
    if (loadedSize?.source === source) return loadedSize;
    if (isValidSize(initialSize)) return initialSize;

    // require 로 넣은 로컬 이미지는 크기를 바로 알 수 있다
    const resolvedSource = Image.resolveAssetSource(source);
    if (isValidSize(resolvedSource)) return resolvedSource;

    return null;
  }, [initialSize, loadedSize, source]);

  const naturalSize = knownSize ?? FALLBACK_SIZE;

  const knownSizeRef = useRef(knownSize);
  knownSizeRef.current = knownSize;

  const handleLoad = event => {
    // 이미 크기를 알고 있으면 다시 그리지 않는다
    if (knownSizeRef.current) return;

    // expo-image 의 onLoad 는 nativeEvent 없이 { source: { width, height } } 를 바로 준다
    const { width, height } = event?.source ?? {};
    if (!isValidSize({ width, height })) return;

    setLoadedSize({ source, width, height });
  };

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

  // 다른 사진으로 바뀌면 확대 · 이동을 되돌린다
  useEffect(() => {
    scaleRef.current = 1;
    translateXRef.current = 0;
    translateYRef.current = 0;

    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
  }, [
    scale,
    source,
    translateX,
    translateY,
  ]);

  const displaySize = useMemo(() => {
    const availableWidth =
      screenWidth - padding.L * 2;
    // 가운데 정렬을 유지하려고 위아래 중 큰 인셋을 양쪽에 똑같이 적용
    const verticalInset =
      Math.max(insets.top, insets.bottom) + VERTICAL_MARGIN;
    const availableHeight =
      screenHeight - verticalInset * 2;

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
    insets.bottom,
    insets.top,
    naturalSize,
    screenHeight,
    screenWidth,
  ]);

  const displaySizeRef = useRef(displaySize);
  displaySizeRef.current = displaySize;

  const containerStyle = useMemo(() => {
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

  if (!source) {
    return null;
  }

  return (
    <View
      {...panResponder.panHandlers}
      style={containerStyle}
    >
      {/* 확대 · 이동은 감싼 Animated.View 가 맡고, 사진은 expo-image 캐시에서 그린다 */}
      <Animated.View
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
      >
        <CachedImage
          source={source}
          onLoad={handleLoad}
          contentFit="contain"
          cachePolicy={IMAGE_CACHE_POLICY}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
  },
});

export default memo(ImageViewer);