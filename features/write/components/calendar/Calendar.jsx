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
  useWindowDimensions,
} from 'react-native';

import { colors } from '../../../../shared/styles/color';
import { padding } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';
import { startOfDay } from '../../../../shared/utils/dateUtils';

import IconButton from '../../../../shared/components/action/IconButton';
import Item, { CALENDAR_ITEM_SIZE } from './Item';
import MonthPage from './MonthPage';
import {
  DAYS_GAP,
  WEEK_COUNT,
  WEEK_DAYS,
  createMonths,
  findMonthIndex,
  getMaxDate,
  getMinDate,
} from './calendarUtils';

const CALENDAR_HORIZONTAL_PADDING = padding.XL;

/**
 * 날짜 영역 높이 (6주 고정)
 *
 * 시트가 콘텐츠 높이에 맞춰 뜨기 때문에(fitContent),
 * 첫 프레임부터 높이를 정해 둬야 올라가는 도중에
 * 높이가 바뀌어 시트가 다시 스냅되지 않습니다.
 */
const DAYS_HEIGHT =
  CALENDAR_ITEM_SIZE * WEEK_COUNT +
  DAYS_GAP * (WEEK_COUNT - 1);

const Calendar = ({
  selectedDate = null,
  onSelectDate,

  autoMoveRequestKey = 0,

  /**
   * 오늘 날짜 선택 허용 여부
   * (타인에게 보내는 편지일 때만 true)
   */
  allowToday = false,

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

  const { width: windowWidth } = useWindowDimensions();

  /**
   * 페이지 폭
   *
   * onLayout을 기다리면 첫 프레임에 달력이 비어 있다가
   * 다음 프레임에 그려지므로, 화면 폭 기준 값으로 바로 그리고
   * 실제 폭이 다르면 onLayout에서 보정합니다.
   */
  const [pageWidth, setPageWidth] = useState(
    () => windowWidth - CALENDAR_HORIZONTAL_PADDING * 2,
  );

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
   * = 기본은 내일, allowToday면 오늘
   */
  const minDate = useMemo(
    () => getMinDate(today, allowToday),
    [today, allowToday],
  );

  /**
   * 선택 가능 최대 날짜
   * = 오늘로부터 정확히 1년 뒤
   */
  const maxDate = useMemo(
    () => getMaxDate(today),
    [today],
  );

  /**
   * 표시 가능한 월 목록 (이번 달 ~ 1년 뒤 달, 총 13개월)
   */
  const months = useMemo(
    () => createMonths(today, maxDate),
    [today, maxDate],
  );

  /**
   * 처음 선택된 날짜가 있는 달에서 바로 시작합니다.
   * (0번째 달을 그렸다가 스크롤해 이동하지 않도록)
   */
  const [initialMonthIndex] = useState(() =>
    Math.max(0, findMonthIndex(months, selectedDate)),
  );

  const [currentMonthIndex, setCurrentMonthIndex] =
    useState(initialMonthIndex);

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

    const targetMonthIndex =
      findMonthIndex(months, selectedDate);

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
      setPageWidth(previous =>
        Math.abs(previous - width) < 1
          ? previous
          : width,
      );
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
              initialScrollIndex={initialMonthIndex}
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: CALENDAR_HORIZONTAL_PADDING,
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
    height: DAYS_HEIGHT,
    overflow: 'hidden',
  },
});

export default memo(Calendar);