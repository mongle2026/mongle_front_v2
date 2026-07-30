import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Item from './Item';

import IcFeed from '../../../../assets/icons/ic_feed.svg';
import IcLetter from '../../../../assets/icons/ic_letter.svg';
import IcProfile from '../../../../assets/icons/ic_profile.svg';

import { colors } from '../../../styles/color';
import { padding } from '../../../styles/token';
import { MAIN_TAB_ROUTES } from './routeNames';

const TAB_CONFIG = {
  [MAIN_TAB_ROUTES.FEED]: {
    label: '피드',
    Icon: IcFeed,
  },

  [MAIN_TAB_ROUTES.LETTER]: {
    label: '편지',
    Icon: IcLetter,
  },

  [MAIN_TAB_ROUTES.PROFILE]: {
    label: '프로필',
    Icon: IcProfile,
  },
};

const BottomNavigation = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  /*
   * Item에 이미 paddingBottom: 24가 있으므로,
   * 안전 영역이 24보다 클 때 차이만큼만 추가합니다.
   */
  const additionalBottomPadding = Math.max(
    insets.bottom - padding.XXL,
    0,
  );

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.container,
        {
          paddingBottom: additionalBottomPadding,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const tabConfig = TAB_CONFIG[route.name];

        if (!tabConfig) {
          return null;
        }

        const { label, Icon } = tabConfig;
        const options = descriptors[route.key]?.options ?? {};
        const isActive = state.index === index;

        const handlePress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const handleLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Item
            key={route.key}
            label={label}
            Icon={Icon}
            isActive={isActive}
            onPress={handlePress}
            onLongPress={handleLongPress}
            accessibilityLabel={
              options.tabBarAccessibilityLabel ?? label
            }
            testID={options.tabBarButtonTestID}
            style={styles.item}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: colors.strokeBrandSubtle,
    backgroundColor: colors.bgLayerDefault,
  },

  item: {
    flex: 1,
  },
});

export default BottomNavigation;