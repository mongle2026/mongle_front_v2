import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../../styles/color';
import { padding } from '../../../styles/token';

import Items from './Items';

const DEFAULT_TABS = ['탭1', '탭2', '탭3', '탭4', '탭5', '탭6'];

const Tabs = ({
  tabs = DEFAULT_TABS,
  activeIndex = 0,
  onChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.background} />

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(241, 242, 244, 0)', colors.bgLayerBasement]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.fade}
      />

      {tabs.map((label, index) => (
        <Items
          key={`${label}-${index}`}
          label={label}
          isActive={index === activeIndex}
          onPress={() => onChange?.(index)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: padding.M,
    paddingRight: padding.M,
    paddingBottom: padding.XL,
    paddingLeft: padding.M,
  },

  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 39,
    backgroundColor: colors.bgLayerBasement,
  },

  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 16,
  },
});

export default memo(Tabs);
