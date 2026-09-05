import React, {
  useCallback,
  useState,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BottomSheet from '../../../../shared/components/overlay/BottomSheet';
import ListHeader from '../../../../shared/components/content/ListHeader';

import {
  TextButton,
  TEXT_BUTTON_SIZE,
  TEXT_BUTTON_VARIANT,
} from '../../../../shared/components/action/TextButton';

import Calendar from '../../components/calendar/Calendar';

import { colors } from '../../../../shared/styles/color';
import { FONT } from '../../../../shared/styles/font';
import {
  gap,
  padding,
} from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

import useDateSelect from '../hooks/useDateSelect';
import {
  DATE_PRESET,
} from '../utils/dateSelect';

const DateSelectBottomSheet = ({
  initialDate = null,
  onClose,
  onConfirm,
}) => {
  const {
    selectedDate,
    copy,

    handleSelectDate,
    handlePressPreset,
    isPresetSelected,
  } = useDateSelect({
    initialDate,
  });

  /**
   * 프리셋 버튼을 누를 때마다 증가합니다.
   *
   * 같은 프리셋을 다시 눌러 selectedDate 값이
   * 실제로 바뀌지 않더라도 Calendar가
   * 다시 해당 날짜의 달로 이동할 수 있게 합니다.
   */
  const [
    calendarMoveRequestKey,
    setCalendarMoveRequestKey,
  ] = useState(0);

  const handlePresetPress = useCallback(
    preset => {
      handlePressPreset(preset);

      setCalendarMoveRequestKey(
        prev => prev + 1,
      );
    },
    [handlePressPreset],
  );

  const handleConfirm =
    useCallback(() => {
      if (!selectedDate) {
        return;
      }

      onConfirm?.(selectedDate);
      onClose?.();
    }, [
      selectedDate,
      onConfirm,
      onClose,
    ]);

  return (
    <BottomSheet
      fitContent
      onClose={onClose}
      // Calendar가 좌우 스와이프로 달을 넘기므로, 세로로
      // 충분히 움직였을 때만 시트 닫기 제스처가 선점하도록
      // 방향 임계값을 둡니다.
      activeOffsetY={[-10, 10]}
      failOffsetX={[-10, 10]}
    >
      {/* ListHeader container */}
      <View
        style={
          styles.listHeaderContainer
        }
      >
        <ListHeader
          size="M"
          informativeText={
            copy.informativeText
          }
          title={copy.title}
        />
      </View>

      {/* Calendar */}
      <Calendar
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        autoMoveRequestKey={
          calendarMoveRequestKey
        }
        leftIcon={
          <Text style={styles.arrow}>
            ‹
          </Text>
        }
        rightIcon={
          <Text style={styles.arrow}>
            ›
          </Text>
        }
      />

      {/* date button container */}
      <View
        style={
          styles.dateButtonContainer
        }
      >
        <TextButton
          variant={
            isPresetSelected(
              DATE_PRESET.WEEK,
            )
              ? TEXT_BUTTON_VARIANT.BG_INFO_WEAK
              : TEXT_BUTTON_VARIANT.NEUTRAL_WEAK
          }
          size={TEXT_BUTTON_SIZE.M}
          font={FONT.SUIT}
          onPress={() =>
            handlePresetPress(
              DATE_PRESET.WEEK,
            )
          }
        >
          일주일 뒤
        </TextButton>

        <TextButton
          variant={
            isPresetSelected(
              DATE_PRESET.MONTH,
            )
              ? TEXT_BUTTON_VARIANT.BG_INFO_WEAK
              : TEXT_BUTTON_VARIANT.NEUTRAL_WEAK
          }
          size={TEXT_BUTTON_SIZE.M}
          font={FONT.SUIT}
          onPress={() =>
            handlePresetPress(
              DATE_PRESET.MONTH,
            )
          }
        >
          한 달 뒤
        </TextButton>

        <TextButton
          variant={
            isPresetSelected(
              DATE_PRESET.YEAR,
            )
              ? TEXT_BUTTON_VARIANT.BG_INFO_WEAK
              : TEXT_BUTTON_VARIANT.NEUTRAL_WEAK
          }
          size={TEXT_BUTTON_SIZE.M}
          font={FONT.SUIT}
          onPress={() =>
            handlePresetPress(
              DATE_PRESET.YEAR,
            )
          }
        >
          일 년 뒤
        </TextButton>
      </View>

      {/* button container */}
      <View
        style={
          styles.buttonContainer
        }
      >
        <TextButton
          variant={
            selectedDate
              ? TEXT_BUTTON_VARIANT.SOLID
              : TEXT_BUTTON_VARIANT.DISABLED
          }
          size={TEXT_BUTTON_SIZE.XL}
          font={FONT.SUIT}
          onPress={handleConfirm}
          style={styles.confirmButton}
        >
          {copy.confirmLabel}
        </TextButton>
      </View>
    </BottomSheet>
  );
};

export default DateSelectBottomSheet;

const styles = StyleSheet.create({
  listHeaderContainer: {
    width: '100%',
    paddingTop: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  arrow: {
    ...typo.suitLabelXLargeStrong,
    color: colors.fgNeutralMuted,
    textAlign: 'center',
  },

  dateButtonContainer: {
    width: '100%',

    paddingTop: padding.M,
    paddingHorizontal: padding.XL,
    paddingBottom: padding.XL,

    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gap.M,
  },

  buttonContainer: {
    width: '100%',

    paddingVertical: padding.M,
    paddingHorizontal: padding.XL,

    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  confirmButton: {
    alignSelf: 'stretch',
  },
});