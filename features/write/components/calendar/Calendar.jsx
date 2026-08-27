import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../../../shared/styles/color';
import { padding } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

import IconButton from '../../../../shared/components/action/IconButton';
import Item from './Item';

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const DAYS_PER_WEEK = 7;
const WEEK_COUNT = 6;
const CALENDAR_CELL_COUNT = DAYS_PER_WEEK * WEEK_COUNT;

const Calendar = ({
  selectedDate = null,
  onSelectDate,

  autoMoveRequestKey = 0,

  leftIcon,
  rightIcon,
}) => {
  const flatListRef = useRef(null);

  /**
   * selectedDate 때문에 마지막으로 자동 이동한 날짜
   *
   * currentMonthIndex가 바뀌어서 effect가 다시 실행되더라도
   * 같은 selectedDate라면 다시 강제 이동하지 않습니다.
   */
  const lastAutoMovedDateRef = useRef(null);

  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);

  /**
   * 오늘
   *
   * 시간값이 섞이면
   * 같은 날짜도 비교 결과가 달라질 수 있으므로
   * 항상 00:00:00으로 정규화합니다.
   */
  const today = useMemo(() => {
    return startOfDay(new Date());
  }, []);

  /**
   * 선택 가능 최소 날짜
   * = 내일
   */
  const minDate = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);

    return date;
  }, [today]);

  /**
   * 선택 가능 최대 날짜
   * = 오늘로부터 정확히 1년 뒤
   */
  const maxDate = useMemo(() => {
    const date = new Date(today);
    date.setFullYear(date.getFullYear() + 1);

    return date;
  }, [today]);

  /**
   * 표시 가능한 월 목록
   *
   * 예:
   * 2026년 8월 현재라면
   *
   * 2026.08
   * 2026.09
   * ...
   * 2027.08
   *
   * 총 13개월
   */
  const months = useMemo(() => {
    const startMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );

    const endMonth = new Date(
      maxDate.getFullYear(),
      maxDate.getMonth(),
      1,
    );

    const result = [];

    let cursor = new Date(startMonth);

    while (cursor <= endMonth) {
      result.push(new Date(cursor));

      cursor = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        1,
      );
    }

    return result;
  }, [today, maxDate]);

  const currentMonth = months[currentMonthIndex];

  const isFirstMonth = currentMonthIndex === 0;
  const isLastMonth = currentMonthIndex === months.length - 1;

  /**
   * 화살표 또는 다른 로직에서 특정 월로 이동
   */
  const moveToMonth = useCallback(
    nextIndex => {
      if (
        nextIndex < 0 ||
        nextIndex >= months.length ||
        pageWidth === 0
      ) {
        return;
      }

      setCurrentMonthIndex(nextIndex);

      flatListRef.current?.scrollToOffset({
        offset: nextIndex * pageWidth,
        animated: true,
      });
    },
    [months.length, pageWidth],
  );

  /**
  * 날짜를 새로 선택하거나
  * 프리셋 버튼을 눌렀을 때만
  * 선택된 날짜가 있는 달로 이동합니다.
  *
  * currentMonthIndex는 dependency에 넣지 않습니다.
  *
  * 따라서 사용자가 화살표/스와이프로
  * 달을 직접 이동하는 동안에는
  * selectedDate가 있는 달로 강제로 돌아가지 않습니다.
  */
  useEffect(() => {
    if (
      !selectedDate ||
      pageWidth === 0
    ) {
      return;
    }

    const selected =
      startOfDay(selectedDate);

    const targetMonthIndex =
      months.findIndex(month => {
        return (
          month.getFullYear() ===
          selected.getFullYear() &&
          month.getMonth() ===
          selected.getMonth()
        );
      });

    if (targetMonthIndex < 0) {
      return;
    }

    moveToMonth(targetMonthIndex);
  }, [
    selectedDate,
    autoMoveRequestKey,
    months,
    pageWidth,
    moveToMonth,
  ]);

  const handlePressPrevious = useCallback(() => {
    if (isFirstMonth) {
      return;
    }

    moveToMonth(currentMonthIndex - 1);
  }, [
    currentMonthIndex,
    isFirstMonth,
    moveToMonth,
  ]);

  const handlePressNext = useCallback(() => {
    if (isLastMonth) {
      return;
    }

    moveToMonth(currentMonthIndex + 1);
  }, [
    currentMonthIndex,
    isLastMonth,
    moveToMonth,
  ]);

  /**
   * 손가락으로 달을 넘긴 뒤
   * 현재 month index 업데이트
   */
  const handleMomentumScrollEnd = useCallback(
    event => {
      if (!pageWidth) {
        return;
      }

      const offsetX =
        event.nativeEvent.contentOffset.x;

      const nextIndex = Math.round(
        offsetX / pageWidth,
      );

      setCurrentMonthIndex(nextIndex);
    },
    [pageWidth],
  );

  const handleDaysLayout = useCallback(event => {
    const width = event.nativeEvent.layout.width;

    if (width > 0) {
      setPageWidth(width);
    }
  }, []);

  /**
   * 한 달의 Calendar page
   */
  const renderMonth = useCallback(
    ({ item: month }) => {
      if (!pageWidth) {
        return null;
      }

      return (
        <MonthPage
          month={month}
          pageWidth={pageWidth}
          selectedDate={selectedDate}
          minDate={minDate}
          maxDate={maxDate}
          onSelectDate={onSelectDate}
        />
      );
    },
    [
      pageWidth,
      selectedDate,
      minDate,
      maxDate,
      onSelectDate,
    ],
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: pageWidth,
      offset: pageWidth * index,
      index,
    }),
    [pageWidth],
  );

  return (
    <View style={styles.container}>
      {/* month */}
      <View style={styles.month}>
        <IconButton
          size="M"
          icon={leftIcon}
          onPress={handlePressPrevious}
          disabled={isFirstMonth}
          accessibilityLabel="이전 달"
        />

        <Text style={styles.monthLabel}>
          {currentMonth.getFullYear()}년{' '}
          {currentMonth.getMonth() + 1}월
        </Text>

        <IconButton
          size="M"
          icon={rightIcon}
          onPress={handlePressNext}
          disabled={isLastMonth}
          accessibilityLabel="다음 달"
        />
      </View>

      {/* calendar */}
      <View style={styles.calendar}>
        {/* section_week */}
        <View style={styles.sectionWeek}>
          {WEEK_DAYS.map(day => (
            <Item
              key={day}
              state="disabled"
            >
              {day}
            </Item>
          ))}
        </View>

        {/* container_days */}
        <View
          style={styles.daysViewport}
          onLayout={handleDaysLayout}
        >
          {pageWidth > 0 && (
            <FlatList
              ref={flatListRef}
              data={months}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              keyExtractor={item =>
                `${item.getFullYear()}-${item.getMonth()}`
              }
              renderItem={renderMonth}
              getItemLayout={getItemLayout}
              onMomentumScrollEnd={
                handleMomentumScrollEnd
              }
              initialNumToRender={1}
              maxToRenderPerBatch={2}
              windowSize={3}
              removeClippedSubviews
            />
          )}
        </View>
      </View>
    </View>
  );
};

const MonthPage = memo(
  ({
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
                  onPress={() => {
                    if (isDisabled) {
                      return;
                    }

                    onSelectDate?.(
                      new Date(normalizedDate),
                    );
                  }}
                >
                  {normalizedDate.getDate()}
                </Item>
              );
            })}
          </View>
        ))}
      </View>
    );
  },
);

/**
 * 한 달을 6주 × 7일 배열로 변환
 *
 * 예:
 *
 * [
 *   [null, null, 1, 2, 3, 4, 5],
 *   [6, 7, 8, 9, 10, 11, 12],
 *   ...
 * ]
 */
const createMonthWeeks = month => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstDay = new Date(
    year,
    monthIndex,
    1,
  ).getDay();

  const lastDate = new Date(
    year,
    monthIndex + 1,
    0,
  ).getDate();

  const cells = Array(
    CALENDAR_CELL_COUNT,
  ).fill(null);

  for (let day = 1; day <= lastDate; day += 1) {
    const cellIndex = firstDay + day - 1;

    cells[cellIndex] = new Date(
      year,
      monthIndex,
      day,
    );
  }

  const weeks = [];

  for (
    let index = 0;
    index < CALENDAR_CELL_COUNT;
    index += DAYS_PER_WEEK
  ) {
    weeks.push(
      cells.slice(
        index,
        index + DAYS_PER_WEEK,
      ),
    );
  }

  return weeks;
};

const startOfDay = date => {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
};

const isSameDate = (dateA, dateB) => {
  const a = startOfDay(dateA);
  const b = startOfDay(dateB);

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: padding.XS,
  },

  // month
  month: {
    paddingVertical: padding.XXS,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  monthLabel: {
    ...typo.suitLabelXLargeStrong,
    color: colors.fgNeutralSolid,
    textAlign: 'center',
  },

  // calendar
  calendar: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },

  // section_week
  sectionWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  /**
   * 실제 스와이프 가능한 영역
   */
  daysViewport: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },

  // container_days
  containerDays: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: padding.XS,
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
    width: 48,
    height: 48,
  },
});

export default memo(Calendar);