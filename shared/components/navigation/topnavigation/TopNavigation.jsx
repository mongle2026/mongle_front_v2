import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import IcBell from '../../../../assets/icons/ic_bell.svg';

import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';
import { typo } from '../../../styles/typo';

import IconButton from '../../action/IconButton';
import Item from './Item';

const EMPTY_TABS = [];
const DOT_SIZE = 6;

const playSelectionHaptic = () => {
  void Haptics.selectionAsync().catch(() => {
    /* 햅틱을 지원하지 않는 환경에서도 탭 전환은 그대로 동작한다 */
  });
};

// Figma 컴포넌트: navigation/TopNavigation (showButton)
// tabs: [{ key, label, accessibilityLabel? }] — 탭 목록은 각 화면(feature)에서 넘긴다
// title: 탭 대신 보여줄 제목 (예: 프로필의 닉네임). 있으면 tabs는 무시한다
// showButton: 오른쪽 아이콘 버튼 (기본 표시). icon 기본값은 알림(ic_bell)
// showDot: 버튼 오른쪽 위 레드닷 (예: 확인하지 않은 알림)
const TopNavigation = ({
  tabs = EMPTY_TABS,
  activeTab = tabs[0]?.key,
  onChangeTab,
  title,
  icon = IcBell,
  buttonAccessibilityLabel = '알림 보기',
  onPressButton,
  onLongPressButton,
  showButton = true,
  showDot = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.itemContainer}>
        {title != null ? (
          <Text
            numberOfLines={1}
            accessibilityRole="header"
            style={styles.title}
          >
            {title}
          </Text>
        ) : tabs.map(tab => (
          <Item
            key={tab.key}
            label={tab.label}
            isActive={activeTab === tab.key}
            onPress={
              onChangeTab
                ? () => {
                    if (tab.key !== activeTab) playSelectionHaptic();
                    onChangeTab(tab.key);
                  }
                : undefined
            }
            accessibilityLabel={tab.accessibilityLabel}
          />
        ))}
      </View>

      {showButton && (
        <View>
          <IconButton
            size="XL"
            icon={icon}
            color={colors.fgNeutralPrimary}
            onPress={onPressButton}
            onLongPress={onLongPressButton}
            accessibilityLabel={buttonAccessibilityLabel}
          />
          {showDot && <View pointerEvents="none" style={styles.dot} />}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    // 알림 버튼이 없어도 높이 유지 (8 + 버튼 38 + 12)
    minHeight: 58,
    paddingTop: padding.M,
    paddingRight: padding.L,
    paddingBottom: padding.L,
    paddingLeft: padding.L,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgBase,
  },

  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.L,
  },

  // 아이콘(XL: 버튼 안쪽 padding.M 부터 22) 오른쪽 위 모서리에 붙인다
  dot: {
    position: 'absolute',
    top: padding.M,
    right: padding.M,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.fillCriticalStrong,
  },

  // Item 의 활성 탭 라벨과 같은 스타일
  title: {
    ...typo.suitTitleXLargeStrong,
    flexShrink: 1,
    color: colors.fgNeutralPrimary,
  },
});

export default memo(TopNavigation);