import { padding } from '../../../../shared/styles/token';

export const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const DAYS_PER_WEEK = 7;
export const WEEK_COUNT = 6;
const CALENDAR_CELL_COUNT = DAYS_PER_WEEK * WEEK_COUNT;

// 주(week) 사이 간격. MonthPage와 날짜 영역 높이 계산에서 같이 씁니다.
export const DAYS_GAP = padding.XS;

/**
 * 선택 가능 최소 날짜
 * = 기본은 내일, allowToday면 오늘
 */
export const getMinDate = (today, allowToday) => {
  const date = new Date(today);

  if (!allowToday) {
    date.setDate(date.getDate() + 1);
  }

  return date;
};

/**
 * 선택 가능 최대 날짜
 * = 오늘로부터 정확히 1년 뒤
 */
export const getMaxDate = today => {
  const date = new Date(today);
  date.setFullYear(date.getFullYear() + 1);

  return date;
};

/**
 * 표시 가능한 월 목록 (각 달의 1일)
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
export const createMonths = (startDate, endDate) => {
  const startMonth = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    1,
  );

  const endMonth = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
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
};

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
export const createMonthWeeks = month => {
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

export const findMonthIndex = (months, date) => {
  if (!date) {
    return -1;
  }

  return months.findIndex(month => (
    month.getFullYear() === date.getFullYear() &&
    month.getMonth() === date.getMonth()
  ));
};
