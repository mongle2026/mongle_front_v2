import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import IcBell from '../../../../assets/icons/ic_bell.svg';

import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';

import IconButton from '../../action/IconButton';
import Item from './Item';

export const TOP_NAVIGATION_TAB = {
  RECOMMENDED: 'recommended',
  FOLLOWING: 'following',
  LETTER_BOX: 'letterBox',
};

// 피드: 추천 / 팔로잉 탭 전환
export const FEED_TOP_NAVIGATION_TABS = [
  { key: TOP_NAVIGATION_TAB.RECOMMENDED, label: '추천', accessibilityLabel: '추천 피드 보기' },
  { key: TOP_NAVIGATION_TAB.FOLLOWING, label: '팔로잉', accessibilityLabel: '팔로잉 피드 보기' },
];

// 편지함: 화면 탭 구분은 TabBar에서 하므로 편지함 탭 하나만 노출
export const LETTER_TOP_NAVIGATION_TABS = [
  { key: TOP_NAVIGATION_TAB.LETTER_BOX, label: '편지함' },
];

const TopNavigation = ({
  tabs = FEED_TOP_NAVIGATION_TABS,
  activeTab = tabs[0]?.key,
  onChangeTab,
  onPressBell,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.itemContainer}>
        {tabs.map(tab => (
          <Item
            key={tab.key}
            label={tab.label}
            isActive={activeTab === tab.key}
            onPress={onChangeTab ? () => onChangeTab(tab.key) : undefined}
            accessibilityLabel={tab.accessibilityLabel}
          />
        ))}
      </View>

      <IconButton
        size="XL"
        icon={IcBell}
        color={colors.fgNeutralSolid}
        onPress={onPressBell}
        accessibilityLabel="알림 보기"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: padding.M,
    paddingRight: padding.L,
    paddingBottom: padding.L,
    paddingLeft: padding.L,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgLayerBasement,
  },

  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.L,
  },
});

export default memo(TopNavigation);