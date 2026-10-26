import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '../../styles/color';
import { padding, gap, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const BORDER_WIDTH = 1;

// 상태별 입력창 테두리 색
const getBorderColor = ({ status, isFocused }) => {
  if (status === 'error') return colors.strokeCritical;
  if (isFocused) return colors.strokeInfo;
  return colors.strokeNeutralSecondary;
};

const getDescriptionColor = status => {
  if (status === 'error') return colors.fgCritical;
  if (status === 'positive') return colors.fgPositive;
  return colors.fgNeutralTertiary;
};

/**
 * @param {string} [label] 입력창 위 제목
 * @param {boolean} [required] true면 제목 옆에 필수 표시(*)를 붙입니다
 * @param {string} [prefix] 입력값 앞에 고정으로 붙는 글자
 * @param {string} [description] 입력창 아래 설명
 * @param {number} maxLength 최대 글자 수. 입력창 아래 오른쪽에 n/maxLength 로 항상 보여줍니다
 * @param {'positive' | 'error'} [status] positive면 설명이 초록색,
 *   error면 테두리·설명·글자 수가 빨간색이 됩니다
 * @param {React.Ref} [containerRef] 제목부터 설명까지 감싼 바깥 View의 ref (위치 측정용)
 */
const TextField = ({
  containerRef,
  label,
  required = false,
  prefix = '@',
  value,
  onChangeText,
  placeholder,
  description,
  maxLength,
  status,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasValue = value?.length > 0;

  const foregroundColor = hasValue
    ? colors.fgNeutralPrimary
    : colors.fgNeutralTertiary;

  const descriptionColor = getDescriptionColor(status);
  const counterColor =
    status === 'error' ? colors.fgCritical : colors.fgNeutralTertiary;

  return (
    <View ref={containerRef} style={styles.container}>
      {label && (
        <View style={styles.label}>
          <Text style={styles.labelText}>{label}</Text>
          {required && <Text style={styles.requiredMark}>*</Text>}
        </View>
      )}

      <View
        style={[
          styles.textField,
          { borderColor: getBorderColor({ status, isFocused }) },
        ]}
      >
        {prefix && (
          <Text style={[styles.inputText, { color: foregroundColor }]}>
            {prefix}
          </Text>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.fgNeutralTertiary}
          maxLength={maxLength}
          onFocus={event => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={[styles.inputText, styles.input]}
          {...textInputProps}
        />
      </View>

      <View style={styles.description}>
        <Text style={[styles.descriptionText, { color: descriptionColor }]}>
          {description}
        </Text>

        <Text style={[styles.descriptionText, { color: counterColor }]}>
          {`${value?.length ?? 0}/${maxLength}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: padding.L,
    paddingHorizontal: padding.L,
    paddingBottom: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.S,
  },

  label: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  labelText: {
    color: colors.fgNeutralPrimary,
    ...typo.suitTitleSmallStrong,
  },

  requiredMark: {
    color: colors.fgCritical,
    ...typo.suitTitleSmallStrong,
  },

  // 테두리 두께만큼 패딩을 줄여 Figma 크기(안쪽 테두리)를 유지한다
  textField: {
    paddingVertical: padding.L - BORDER_WIDTH,
    paddingHorizontal: padding.XL - BORDER_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.XS,
    alignSelf: 'stretch',
    borderRadius: radius.M,
    borderWidth: BORDER_WIDTH,
  },

  inputText: {
    ...typo.suitBodyLarge,
  },

  input: {
    flex: 1,
    padding: 0,
    color: colors.fgNeutralPrimary,
  },

  description: {
    paddingTop: padding.XS,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  descriptionText: {
    ...typo.suitLabelMediumStrong,
  },
});

export default TextField;
