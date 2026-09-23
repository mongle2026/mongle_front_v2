import React, { useCallback, useRef, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Item from './Item';

import IcFeed from '../../../../assets/icons/ic_feed.svg';
import IcLetter from '../../../../assets/icons/ic_letter.svg';
import IcArchive from '../../../../assets/icons/ic_archive.svg';

import { colors } from '../../../styles/color';
import { padding } from '../../../styles/token';
import { MAIN_TAB_ROUTES } from './routeNames';

let bottomNavigationHeight = 0;

// BottomNavigation 윗변의 '창 좌표' y.
let bottomNavigationWindowTop = 0;

const metricsListeners = new Set();

const notifyMetricsChanged = () => {
  metricsListeners.forEach(listener => listener());
};

const setBottomNavigationHeight = nextHeight => {
  if (bottomNavigationHeight === nextHeight) {
    return;
  }

  bottomNavigationHeight = nextHeight;
  notifyMetricsChanged();
};

const setBottomNavigationWindowTop = nextWindowTop => {
  if (bottomNavigationWindowTop === nextWindowTop) {
    return;
  }

  bottomNavigationWindowTop = nextWindowTop;
  notifyMetricsChanged();
};

const subscribeBottomNavigationMetrics = listener => {
  metricsListeners.add(listener);

  return () => {
    metricsListeners.delete(listener);
  };
};

const getBottomNavigationHeight = () => bottomNavigationHeight;

const getBottomNavigationWindowTop = () => bottomNavigationWindowTop;

export const useBottomNavigationHeight = () => {
  return useSyncExternalStore(
    subscribeBottomNavigationMetrics,
    getBottomNavigationHeight,
    getBottomNavigationHeight,
  );
};

/** 아직 측정 전이면 0. */
export const useBottomNavigationWindowTop = () => {
  return useSyncExternalStore(
    subscribeBottomNavigationMetrics,
    getBottomNavigationWindowTop,
    getBottomNavigationWindowTop,
  );
};

const TAB_CONFIG = {
  [MAIN_TAB_ROUTES.FEED]: {
    label: '피드',
    Icon: IcFeed,
  },
  [MAIN_TAB_ROUTES.LETTER]: {
    label: '편지함',
    Icon: IcLetter,
  },
  [MAIN_TAB_ROUTES.ARCHIVE]: {
    label: '보관함',
    Icon: IcArchive,
  },
};

const BottomNavigation = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  const containerRef = useRef(null);

  const additionalBottomPadding = Math.max(
    insets.bottom - padding.XXL,
    0,
  );

  const handleLayout = useCallback(event => {
    setBottomNavigationHeight(
      event.nativeEvent.layout.height,
    );

    containerRef.current?.measureInWindow((x, y) => {
      if (typeof y !== 'number') return;

      setBottomNavigationWindowTop(y);
    });
  }, []);

  return (
    <View
      ref={containerRef}
      accessibilityRole="tablist"
      onLayout={handleLayout}
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

          if (
            !isActive &&
            !event.defaultPrevented
          ) {
            navigation.navigate(
              route.name,
              route.params,
            );
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
            icon={Icon}
            isActive={isActive}
            onPress={handlePress}
            onLongPress={handleLongPress}
            accessibilityLabel={
              options.tabBarAccessibilityLabel ??
              label
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
    borderTopColor: colors.strokeNeutralFaint,
    backgroundColor: colors.bgLayerDefault,
  },

  item: {
    flex: 1,
  },
});

export default BottomNavigation;