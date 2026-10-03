import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import IcBell from '../../../../assets/icons/ic_bell.svg';

import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';

import IconButton from '../../action/IconButton';
import ProfileImg from '../../atomic/ProfileImg';
import Item from './Item';

const EMPTY_TABS = [];

// tabs: [{ key, label, accessibilityLabel? }] — 탭 목록은 각 화면(feature)에서 넘긴다
const TopNavigation = ({
  tabs = EMPTY_TABS,
  activeTab = tabs[0]?.key,
  onChangeTab,
  onPressBell,
  showProfile = false,
  profileImageUri,
  onPressProfile,
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

      {showProfile ? (
        <Pressable
          onPress={onPressProfile}
          disabled={!onPressProfile}
          accessibilityRole="button"
          accessibilityLabel="프로필 보기"
        >
          <ProfileImg size="M" imageUri={profileImageUri} style={styles.profileImg} />
        </Pressable>
      ) : (
        <IconButton
          size="XL"
          icon={IcBell}
          color={colors.fgNeutralSolid}
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
    backgroundColor: colors.bgLayerBasement,
  },

  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: padding.XXS,
    alignItems: 'center',
    gap: gap.L,
  },

  profileImg: {
    borderRadius: 999,
  },
});

export default memo(TopNavigation);