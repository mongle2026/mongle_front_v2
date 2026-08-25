import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IlEmptyRecipient from '../../../assets/illustrations/il_empty_recipient.svg';

import { colors } from '../../styles/color';
import { gap, padding } from '../../styles/token';
import { typo } from '../../styles/typo';

const Empty = ({
  title,
  body,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <IlEmptyRecipient
          width="100%"
          height="100%"
        />
      </View>

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

  illustration: {
    width: 200,
    height: 200,
    flexShrink: 0,
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
    ...typo.suitBodyXLarge,

    color: colors.fgNeutralWeak,
    textAlign: 'center',
  },
});