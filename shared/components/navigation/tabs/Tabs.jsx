import { memo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../../styles/color';
import { padding } from '../../../styles/token';

import Items from './Items';

const DEFAULT_TABS = ['탭1', '탭2', '탭3', '탭4', '탭5', '탭6'];
// 하단 그라데이션 높이. 아래 목록이 이 높이만큼 Tabs 밑으로 들어와야 그라데이션이 보인다
export const TABS_BOTTOM_FADE_HEIGHT = padding.XL;

const Tabs = ({
  tabs = DEFAULT_TABS,
  activeIndex = 0,
  onChange,
  // 탭 영역과 그라데이션 색. #rrggbb 형식이어야 한다 (뒤에 00을 붙여 투명색을 만든다)
  backgroundColor = colors.bgLayerBasement,
  style,
}) => {
  const fadeColors = [`${backgroundColor}00`, backgroundColor];

  const [showRightFade, setShowRightFade] = useState(false);
  const scrollRef = useRef({ layoutWidth: 0, contentWidth: 0, x: 0 });

  // 탭이 넘치고, 아직 오른쪽 끝까지 스크롤하지 않았을 때만 오른쪽 fade 표시
  const updateRightFade = () => {
    const { layoutWidth, contentWidth, x } = scrollRef.current;
    setShowRightFade(contentWidth > layoutWidth && x + layoutWidth < contentWidth - 1);
  };

  return (
    <View style={[styles.container, style]}>
      {/* 탭 영역은 단색, 하단 패딩 영역은 배경색 → 투명 그라데이션 */}
      <View style={[styles.background, { backgroundColor }]} />

      <LinearGradient
        pointerEvents="none"
        colors={fadeColors}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.fade}
      />

      {/* 탭이 화면 너비를 넘으면 가로 스크롤 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.itemContainer}
        onLayout={(e) => {
          scrollRef.current.layoutWidth = e.nativeEvent.layout.width;
          updateRightFade();
        }}
        onContentSizeChange={(width) => {
          scrollRef.current.contentWidth = width;
          updateRightFade();
        }}
        onScroll={(e) => {
          scrollRef.current.x = e.nativeEvent.contentOffset.x;
          updateRightFade();
        }}
        scrollEventThrottle={16}
      >
        {tabs.map((label, index) => (
          <Items
            key={`${label}-${index}`}
            label={label}
            isActive={index === activeIndex}
            onPress={() => onChange?.(index)}
          />
        ))}
      </ScrollView>

      {/* ScrollView 위에 겹치도록 뒤에 렌더링 */}
      {showRightFade && (
        <LinearGradient
          pointerEvents="none"
          colors={fadeColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rightFade}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1,
    paddingTop: padding.M,
    paddingBottom: TABS_BOTTOM_FADE_HEIGHT,
  },

  scroll: {
    flexGrow: 0,
  },

  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: padding.M,
  },

  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: TABS_BOTTOM_FADE_HEIGHT,
  },

  rightFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: TABS_BOTTOM_FADE_HEIGHT,
    width: 100,
  },

  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TABS_BOTTOM_FADE_HEIGHT,
  },
});

export default memo(Tabs);
