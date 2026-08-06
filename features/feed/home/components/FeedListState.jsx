import React, { memo, } from 'react';

import { ActivityIndicator, StyleSheet, Text, View, } from 'react-native';

import { colors, } from '../../../../shared/styles/color';

import { padding, } from '../../../../shared/styles/token';

const FeedListState = ({
  loading = false,
  message = '',
}) => {
  return (
    <View
      style={
        styles.container
      }
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text
          style={
            styles.message
          }
        >
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: padding.XL,
  },

  message: {
    color: colors.fgNeutralSubtle,
    textAlign: 'center',
  },
});

export default memo(
  FeedListState,
);