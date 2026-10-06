import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import IcBell from '../../../../assets/icons/ic_bell.svg';

import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';

import IconButton from '../../action/IconButton';
import Item from './Item';

const EMPTY_TABS = [];

// Figma 컴포넌트: navigation/TopNavigation (showButton)
// tabs: [{ key, label, accessibilityLabel? }] — 탭 목록은 각 화면(feature)에서 넘긴다
// showButton: 알림 버튼 (기본 표시)
const TopNavigation = ({
  tabs = EMPTY_TABS,
  activeTab = tabs[0]?.key,
  onChangeTab,
  onPressBell,
  showButton = true,
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

      {showButton && (
        <IconButton
          size="XL"
          icon={IcBell}
          color={colors.fgNeutralPrimary}
          onPress={onPressBell}
          accessibilityLabel="알림 보기"
        />
      )}
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
    backgroundColor: colors.bgBase,
  },

  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.L,
  },
});

export default memo(TopNavigation);