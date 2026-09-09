import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import Items from './Items';

const DEFAULT_TABS = ['탭1', '탭2'];

const TabBar = ({
  tabs = DEFAULT_TABS,
  activeIndex = 0,
  onChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {tabs.slice(0, 2).map((label, index) => (
        <Items
          key={`${label}-${index}`}
          label={label}
          isActive={index === activeIndex}
          onPress={() => onChange?.(index)}
          style={styles.tab}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  tab: {
    flex: 1,
  },
});

export default memo(TabBar);
