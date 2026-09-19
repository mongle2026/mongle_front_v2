import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { isSameDate, startOfDay } from '../../../../shared/utils/dateUtils';

import Item, { CALENDAR_ITEM_SIZE } from './Item';
import { DAYS_GAP, createMonthWeeks } from './calendarUtils';

/**
 * Calendar 날짜 영역의 한 달 (6주 × 7일).
 * Calendar의 가로 스와이프 목록에서 한 페이지로 쓰입니다.
 */
const MonthPage = ({
  month,
  pageWidth,
  selectedDate,
  minDate,
  maxDate,
  onSelectDate,
}) => {
  const weeks = useMemo(() => {
    return createMonthWeeks(month);
  }, [month]);

  return (
    <View
      style={[
        styles.containerDays,
        {
          width: pageWidth,
        },
      ]}
    >
      {weeks.map((week, weekIndex) => (
        <View
          key={weekIndex}
          style={styles.containerWeek}
        >
          {week.map((date, dayIndex) => {
            /**
             * 해당 월에 포함되지 않는 빈 칸
             */
            if (!date) {
              return (
                <View
                  key={`empty-${weekIndex}-${dayIndex}`}
                  style={styles.emptyItem}
                />
              );
            }

            const normalizedDate = startOfDay(date);

            const isDisabled =
              normalizedDate < minDate ||
              normalizedDate > maxDate;

            const isSelected =
              selectedDate &&
              isSameDate(
                normalizedDate,
                selectedDate,
              );

            const state = isDisabled
              ? 'disabled'
              : isSelected
                ? 'current'
                : 'default';

            return (
              <Item
                key={normalizedDate.getTime()}
                state={state}
                onPress={
                  isDisabled
                    ? undefined
                    : () => {
                      onSelectDate?.(
                        new Date(normalizedDate),
                      );
                    }
                }
              >
                {normalizedDate.getDate()}
              </Item>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export default memo(MonthPage);

const styles = StyleSheet.create({
  // container_days
  containerDays: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: DAYS_GAP,
  },

  // container_week
  containerWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  /**
   * Item과 정확히 같은 크기.
   *
   * 이전/다음 달 날짜를 표시하지 않더라도
   * 요일 위치가 틀어지지 않도록 공간만 차지합니다.
   */
  emptyItem: {
    width: CALENDAR_ITEM_SIZE,
    height: CALENDAR_ITEM_SIZE,
  },
});
