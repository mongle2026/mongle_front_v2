import React, {
  useCallback,
  useState,
} from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import BottomSheet from '../../../../shared/components/overlay/BottomSheet';
import ListHeader from '../../../../shared/components/content/ListHeader';

import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../../shared/components/action/Button';

import Calendar from '../../components/calendar/Calendar';

import { FONT } from '../../../../shared/styles/fontType';
import {
  gap,
  padding,
} from '../../../../shared/styles/token';

import useDateSelect from '../hooks/useDateSelect';
import {
  DATE_PRESET,
  DATE_PRESET_LABEL,
} from '../utils/dateSelect';

// 즉시 · 일주일 뒤 · 한 달 뒤 · 일 년 뒤 ('즉시'는 allowToday 일 때만)
const PRESET_BUTTONS = Object.values(DATE_PRESET);

const DateSelectBottomSheet = ({
  initialDate = null,
  onClose,
  onConfirm,
  /**
   * 오늘 날짜 / '즉시' 선택 허용 여부
   * (타인에게 보내는 편지일 때만 true)
   */
  allowToday = false,
}) => {
  const {
    selectedDate,
    copy,

    handleSelectDate,
    handlePressPreset,
    isPresetSelected,
  } = useDateSelect({
    initialDate,
    allowToday,
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
        allowToday={allowToday}
        autoMoveRequestKey={
          calendarMoveRequestKey
        }
      />

      {/* date button container */}
      <View
        style={
          styles.dateButtonContainer
        }
      >
        {PRESET_BUTTONS
          .filter(preset =>
            allowToday || preset !== DATE_PRESET.NOW,
          )
          .map(preset => (
            <Button
              key={preset}
              variant={
                isPresetSelected(preset)
                  ? BUTTON_VARIANT.INFO_WEAK
                  : BUTTON_VARIANT.WEAK
              }
              size={BUTTON_SIZE.M}
              font={FONT.SUIT}
              onPress={() =>
                handlePresetPress(preset)
              }
            >
              {DATE_PRESET_LABEL[preset]}
            </Button>
          ))}
      </View>

      {/* button container */}
      <View
        style={
          styles.buttonContainer
        }
      >
        <Button
          variant={
            selectedDate
              ? BUTTON_VARIANT.SOLID
              : BUTTON_VARIANT.DISABLED
          }
          size={BUTTON_SIZE.XL}
          font={FONT.SUIT}
          onPress={handleConfirm}
          style={styles.confirmButton}
        >
          {copy.confirmLabel}
        </Button>
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

  dateButtonContainer: {
    width: '100%',

    paddingTop: padding.M,
    paddingHorizontal: padding.XL,
    paddingBottom: padding.XL,

    flexDirection: 'row',
    flexWrap: 'wrap',
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