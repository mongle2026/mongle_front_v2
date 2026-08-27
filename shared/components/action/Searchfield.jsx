import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { colors } from '../../styles/color';
import { padding, gap, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

import IcSearch from '../../../assets/icons/ic_search.svg';

const DEFAULT_PLACEHOLDER = '편지를 받을 사람을 검색해 주세요.';

const SearchField = ({
  value,
  onChangeText,
  placeholder = DEFAULT_PLACEHOLDER,
  ...textInputProps
}) => {
  const hasValue = value?.length > 0;

  const foregroundColor = hasValue
    ? colors.fgNeutralSolid
    : colors.fgPlaceholder;

  return (
    <View style={styles.container}>
      <View style={styles.searchField}>
        <IcSearch
          width={20}
          height={20}
          color={foregroundColor}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.fgPlaceholder}
          style={styles.input}
          {...textInputProps}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: padding.XL,
    paddingRight: padding.XL,
    paddingBottom: padding.XS,
    paddingLeft: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  searchField: {
    width: '100%',
    paddingVertical: padding.L,
    paddingHorizontal: padding.XL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
    borderRadius: radius.S,
    backgroundColor: colors.bgLayerBasement,
  },

  input: {
    flex: 1,
    padding: 0,
    color: colors.fgNeutralSolid,
    ...typo.suitLabelXLarge,
  },
});

export default SearchField;