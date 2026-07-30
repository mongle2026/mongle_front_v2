import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import IcBell from '../../../../assets/icons/ic_bell.svg';

import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';

import IconButton from '../../action/IconButton';
import Item from './Item';

export const TOP_NAVIGATION_TAB = {
  RECOMMENDED: 'recommended',
  FOLLOWING: 'following',
};

const TopNavigation = ({
  activeTab = TOP_NAVIGATION_TAB.RECOMMENDED,
  onChangeTab,
  onPressBell,
  style,
}) => {
  const handlePressRecommended = useCallback(() => {
    onChangeTab?.(TOP_NAVIGATION_TAB.RECOMMENDED);
  }, [onChangeTab]);

  const handlePressFollowing = useCallback(() => {
    onChangeTab?.(TOP_NAVIGATION_TAB.FOLLOWING);
  }, [onChangeTab]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.itemContainer}>
        <Item
          label="추천"
          isActive={activeTab === TOP_NAVIGATION_TAB.RECOMMENDED}
          onPress={handlePressRecommended}
          accessibilityLabel="추천 피드 보기"
        />

        <Item
          label="팔로잉"
          isActive={activeTab === TOP_NAVIGATION_TAB.FOLLOWING}
          onPress={handlePressFollowing}
          accessibilityLabel="팔로잉 피드 보기"
        />
      </View>

      <IconButton
        size="M"
        icon={<IcBell width={18} height={18} />}
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