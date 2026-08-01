import React, { memo, useCallback, useEffect, useState, } from 'react';
import { Pressable, StyleSheet, TextInput, View, } from 'react-native';

import ProfileImg from '../../../../shared/atomic/ProfileImg';
import ArrowIcon from '../../../../assets/icons/ic_arrow.svg';

import { colors } from '../../../../shared/styles/color';
import { gap, padding, radius, } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

const INPUT_LINE_HEIGHT = typo.suitLabelLarge.lineHeight;

// 입력창 내부 텍스트 영역 기준
const MIN_INPUT_HEIGHT = 20;
const MAX_INPUT_HEIGHT = INPUT_LINE_HEIGHT * 4;

const CommentBar = ({
  authorId,
  profileImageUri,
  value = '',
  onChangeText,
  onSubmit,
  disabled = false,
}) => {
  const [inputHeight, setInputHeight] =
    useState(MIN_INPUT_HEIGHT);
  const [isScrollable, setIsScrollable] =
    useState(false);

  const normalizedAuthorId =
    authorId?.replace(/^@/, '') ?? '';

  const placeholder = normalizedAuthorId
    ? `@${normalizedAuthorId}로 댓글 작성`
    : '댓글 작성';

  const trimmedValue = value.trim();

  const canSubmit =
    trimmedValue.length > 0 && !disabled;

  useEffect(() => {
    if (value.length === 0) {
      setInputHeight(MIN_INPUT_HEIGHT);
      setIsScrollable(false);
    }
  }, [value]);

  const handleContentSizeChange = useCallback(
    ({ nativeEvent }) => {
      const contentHeight =
        nativeEvent.contentSize.height;

      const nextHeight = Math.min(
        Math.max(
          Math.ceil(contentHeight),
          MIN_INPUT_HEIGHT
        ),
        MAX_INPUT_HEIGHT
      );

      setInputHeight(nextHeight);
      setIsScrollable(
        contentHeight > MAX_INPUT_HEIGHT
      );
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit) {
      return;
    }

    onSubmit?.(trimmedValue);
  }, [canSubmit, onSubmit, trimmedValue]);

  return (
    <View style={styles.container}>
      <ProfileImg
        imageUri={profileImageUri}
        size="L"
      />

      <View style={styles.textField}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            colors.fgPlaceholder
          }
          multiline
          editable={!disabled}
          scrollEnabled={isScrollable}
          onContentSizeChange={
            handleContentSizeChange
          }
          textAlignVertical="top"
          underlineColorAndroid="transparent"
          accessibilityLabel="댓글 입력"
          style={[
            styles.input,
            {
              height: inputHeight,
            },
          ]}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="댓글 등록"
          hitSlop={8}
          disabled={!canSubmit}
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          <ArrowIcon
            width={20}
            height={20}
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: gap.S,

    paddingVertical: padding.M,
    paddingHorizontal: padding.L,

    borderTopWidth: 0.5,
    borderTopColor: colors.strokeBrandWeak,
    backgroundColor: colors.bgLayerDefault,
  },

  textField: {
    flex: 1,
    alignSelf: 'stretch',
    minWidth: 0,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: gap.S,

    paddingVertical: padding.M,
    paddingHorizontal: padding.L,

    borderRadius: radius.S,
    backgroundColor: colors.bgBrandWeak,
  },

  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,

    color: colors.fgBrand,

    ...typo.suitLabelLarge,

    // 입력 중인 문장은 좌측 정렬이 자연스럽고,
    // iOS와 Android 간 결과도 더 일관적입니다.
    textAlign: 'left',
  },

  submitButton: {
    width: 20,
    height: 20,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(CommentBar);