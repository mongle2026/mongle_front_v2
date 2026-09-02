import React, { memo, useCallback, useEffect, useRef, useState, } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, } from 'react-native';

import ProfileImg from '../../../../shared/components/atomic/ProfileImg';
import IconButton from '../../../../shared/components/action/IconButton';

import IcArrowUp from '../../../../assets/icons/ic_arrowup.svg';

import { colors } from '../../../../shared/styles/color';
import {
  gap,
  padding,
  radius,
} from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

const MAX_COMMENT_LENGTH = 400;

const INPUT_LINE_HEIGHT = 21;
const INPUT_MIN_HEIGHT = INPUT_LINE_HEIGHT;
const INPUT_MAX_HEIGHT = INPUT_LINE_HEIGHT * 4;

const CommentBar = ({
  value = '',
  onChangeText,
  onSubmit,

  profileImageUri,
  targetUsername,

  focusRequestKey = 0,

  disabled = false,
  style,
}) => {
  const inputRef = useRef(null);

  // 답글 버튼으로 강제 재포커스할지
  const forceRefocusRef = useRef(false);

  // 강제 재포커스 과정의 blur에서는
  // CommentBar를 기본 상태로 닫지 않음
  const ignoreNextBlurRef = useRef(false);

  const [isEditing, setIsEditing] = useState(false);
  const [inputHeight, setInputHeight] =
    useState(INPUT_MIN_HEIGHT);

  const textLength = value.length;
  const isOverLimit =
    textLength > MAX_COMMENT_LENGTH;

  const hasText =
    value.trim().length > 0;

  const isSubmitDisabled =
    disabled ||
    !hasText ||
    isOverLimit;

  const openEditor = useCallback(() => {
    setIsEditing(true);
  }, []);

  // 외부에서 "답글 달기"를 누른 경우
  useEffect(() => {
    if (focusRequestKey <= 0) {
      return;
    }

    forceRefocusRef.current = true;
    setIsEditing(true);
  }, [focusRequestKey]);

  // TextInput 렌더링 후 focus
  // 이미 focus 상태라면 한번 blur 후 다시 focus해서
  // 키보드를 확실하게 다시 올림
  useEffect(() => {
    if (!isEditing) {
      return;
    }

    let refocusFrame = null;

    const focusFrame =
      requestAnimationFrame(() => {
        const input =
          inputRef.current;

        if (!input) {
          return;
        }

        const shouldForceRefocus =
          forceRefocusRef.current;

        if (
          shouldForceRefocus &&
          input.isFocused?.()
        ) {
          ignoreNextBlurRef.current =
            true;

          input.blur();

          refocusFrame =
            requestAnimationFrame(() => {
              forceRefocusRef.current =
                false;

              inputRef.current?.focus();
            });

          return;
        }

        forceRefocusRef.current =
          false;

        input.focus();
      });

    return () => {
      cancelAnimationFrame(
        focusFrame,
      );

      if (refocusFrame !== null) {
        cancelAnimationFrame(
          refocusFrame,
        );
      }
    };
  }, [
    isEditing,
    focusRequestKey,
  ]);

  const handleBlur = useCallback(() => {
    // 답글 버튼을 눌러 강제로
    // blur → focus 하는 과정이라면
    // CommentBar를 닫지 않음
    if (ignoreNextBlurRef.current) {
      ignoreNextBlurRef.current =
        false;

      return;
    }

    if (!value.trim()) {
      setIsEditing(false);
      setInputHeight(
        INPUT_MIN_HEIGHT,
      );
    }
  }, [value]);

  const updateInputHeight = useCallback((height) => {
    const nextHeight = Math.min(
      Math.max(
        height,
        INPUT_MIN_HEIGHT,
      ),
      INPUT_MAX_HEIGHT,
    );

    setInputHeight((prevHeight) =>
      prevHeight === nextHeight
        ? prevHeight
        : nextHeight,
    );
  }, []);

  useEffect(() => {
    if (value.length === 0) {
      setInputHeight(INPUT_MIN_HEIGHT);
    }
  }, [value]);

  const handleContentSizeChange = useCallback(
    (event) => {
      if (Platform.OS === 'ios') {
        return;
      }

      updateInputHeight(
        event.nativeEvent.contentSize.height,
      );
    },
    [updateInputHeight],
  );

  const handleMeasureLayout = useCallback(
    (event) => {
      if (Platform.OS !== 'ios') {
        return;
      }

      updateInputHeight(
        event.nativeEvent.layout.height,
      );
    },
    [updateInputHeight],
  );

  const handleSubmit = useCallback(() => {
    if (isSubmitDisabled) {
      return;
    }

    onSubmit?.(value.trim());
  }, [
    isSubmitDisabled,
    onSubmit,
    value,
  ]);

  if (!isEditing) {
    return (
      <View
        style={[
          styles.container,
          style,
        ]}
      >
        <View style={styles.defaultBar}>
          <ProfileImg
            imageUri={profileImageUri}
            size="S"
          />

          <Pressable
            onPress={openEditor}
            style={styles.placeholderButton}
            accessibilityRole="button"
            accessibilityLabel="댓글 작성"
          >
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.placeholder}
            >
              댓글을 남겨보세요.
            </Text>
          </Pressable>

          <IconButton
            size="S"
            icon={IcArrowUp}
            color={colors.fgDisabled}
            disabled
            style={styles.submitButton}
            accessibilityLabel="댓글 등록"
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        style,
      ]}
    >
      <View style={styles.textField}>
        {Platform.OS === 'ios' && (
          <Text
            pointerEvents="none"
            accessible={false}
            onLayout={handleMeasureLayout}
            style={styles.inputMeasure}
          >
            {value || ' '}
          </Text>
        )}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onBlur={handleBlur}
          onContentSizeChange={
            handleContentSizeChange
          }
          placeholder="댓글을 남겨보세요."
          placeholderTextColor={
            colors.fgPlaceholder
          }
          multiline
          scrollEnabled={
            inputHeight >= INPUT_MAX_HEIGHT
          }
          textAlignVertical="top"
          selectionColor={colors.fgNeutralSolid}
          style={[
            styles.input,
            {
              height: inputHeight,
            },
          ]}
        />
      </View>

      <View style={styles.profileBar}>
        <ProfileImg
          imageUri={profileImageUri}
          size="S"
        />

        <View style={styles.idContainer}>
          {!!targetUsername && (
            <>
              <Text
                numberOfLines={1}
                style={styles.targetId}
              >
                @{targetUsername}
              </Text>

              <Text
                numberOfLines={1}
                style={styles.targetDescription}
              >
                님에게 댓글 작성
              </Text>
            </>
          )}
        </View>

        <View style={styles.actionBar}>
          <View style={styles.countContainer}>
            <Text
              style={[
                styles.currentCount,
                isOverLimit &&
                styles.currentCountCritical,
              ]}
            >
              {textLength}
            </Text>

            <Text style={styles.maxCount}>
              /{MAX_COMMENT_LENGTH}
            </Text>
          </View>

          <IconButton
            size="S"
            icon={IcArrowUp}
            color={
              isSubmitDisabled
                ? colors.fgDisabled
                : colors.fgNeutralSolid
            }
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            style={styles.submitButton}
            accessibilityLabel="댓글 등록"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,

    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: gap.M,

    borderTopWidth: 0.5,
    borderTopColor: colors.strokeNeutralSubtle,

    backgroundColor: colors.bgLayerDefault,
  },

  // 기본 상태
  defaultBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
  },

  placeholderButton: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },

  placeholder: {
    ...typo.suitBodyLarge,

    width: '100%',

    overflow: 'hidden',

    color: colors.fgPlaceholder,
    textAlign: 'justify',
  },

  // 입력 상태
  textField: {
    width: '100%',
    alignSelf: 'stretch',

    position: 'relative',

    flexDirection: 'row',
    alignItems: 'flex-end',

    borderRadius: radius.S,
    overflow: 'hidden',
  },

  input: {
    ...typo.suitBodyLarge,

    width: '100%',
    minHeight: INPUT_MIN_HEIGHT,
    maxHeight: INPUT_MAX_HEIGHT,

    paddingHorizontal: 0,
    paddingVertical: 0,
    margin: 0,

    color: colors.fgNeutralSolid,
    textAlign: 'justify',
  },

  inputMeasure: {
    ...typo.suitBodyLarge,

    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,

    paddingHorizontal: 0,
    paddingVertical: 0,
    margin: 0,

    opacity: 0,

    textAlign: 'justify',
  },

  profileBar: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
  },

  idContainer: {
    flex: 1,
    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,

    overflow: 'hidden',
  },

  targetId: {
    ...typo.suitLabelMedium,

    flexShrink: 1,

    color: colors.fgNeutralWeak,
    textAlign: 'justify',
  },

  targetDescription: {
    ...typo.suitLabelMedium,

    flexShrink: 0,

    color: colors.fgNeutralWeak,
    textAlign: 'justify',
  },

  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: gap.M,

    flexShrink: 0,
  },

  countContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },

  currentCount: {
    ...typo.suitLabelMediumStrong,

    color: colors.fgNeutralSubtle,
    textAlign: 'right',
  },

  currentCountCritical: {
    color: colors.fgCritical,
  },

  maxCount: {
    ...typo.suitLabelMediumStrong,

    color: colors.fgNeutralWeak,
    textAlign: 'right',
  },

  submitButton: {
    opacity: 1,
  },
});

export default memo(CommentBar);