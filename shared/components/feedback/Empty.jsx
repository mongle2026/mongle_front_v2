import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../styles/color';
import { gap, padding } from '../../styles/token';
import { typo } from '../../styles/typo';

const Empty = ({
  icon: Icon,
  title,
  body,
}) => {
  return (
    <View style={styles.container}>
      {Icon && <Icon width={40} height={40} />}

      <View style={styles.textContainer}>
        {title ? (
          <Text
            allowFontScaling={false}
            style={styles.title}
          >
            {title}
          </Text>
        ) : null}

        {body ? (
          <Text
            allowFontScaling={false}
            style={styles.body}
          >
            {body}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default Empty;

const styles = StyleSheet.create({
  container: {
    width: '100%',

    paddingVertical: padding.XL,

    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',

    gap: gap.L,
  },

  textContainer: {
    flexDirection: 'column',
    alignItems: 'center',

    gap: gap.XS,
  },

  title: {
    ...typo.suitTitleMediumStrong,

    color: colors.fgPlaceholder,
    textAlign: 'center',
  },

  body: {
    ...typo.suitBodyLarge,

    color: colors.fgNeutralSubtle,
    textAlign: 'center',
  },
});