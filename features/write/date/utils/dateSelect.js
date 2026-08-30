export const DATE_PRESET = Object.freeze({
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
});

export const DATE_PRESET_LABEL = Object.freeze({
  [DATE_PRESET.WEEK]: '일주일 뒤',
  [DATE_PRESET.MONTH]: '한 달 뒤',
  [DATE_PRESET.YEAR]: '일 년 뒤',
});

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 시간을 제거한 날짜
 */
export const startOfDay = date => {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
};

/**
 * 같은 날짜인지 비교
 */
export const isSameDate = (
  dateA,
  dateB,
) => {
  if (!dateA || !dateB) {
    return false;
  }

  const a = startOfDay(dateA);
  const b = startOfDay(dateB);

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

/**
 * N일 뒤
 */
export const addDays = (
  date,
  amount,
) => {
  const result = new Date(date);

  result.setDate(
    result.getDate() + amount,
  );

  return startOfDay(result);
};

/**
 * N개월 뒤
 *
 * 예:
 * 1월 31일 → 2월 마지막 날
 */
export const addMonthsClamped = (
  date,
  amount,
) => {
  const originalDay = date.getDate();

  const result = new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1,
  );

  const lastDay =
    new Date(
      result.getFullYear(),
      result.getMonth() + 1,
      0,
    ).getDate();

  result.setDate(
    Math.min(
      originalDay,
      lastDay,
    ),
  );

  return startOfDay(result);
};

/**
 * N년 뒤
 *
 * 윤년 2월 29일 처리
 */
export const addYearsClamped = (
  date,
  amount,
) => {
  const targetYear =
    date.getFullYear() + amount;

  const month = date.getMonth();
  const originalDay = date.getDate();

  const lastDay =
    new Date(
      targetYear,
      month + 1,
      0,
    ).getDate();

  return startOfDay(
    new Date(
      targetYear,
      month,
      Math.min(
        originalDay,
        lastDay,
      ),
    ),
  );
};

/**
 * 오늘과 선택 날짜 사이의 날짜 차이
 *
 * 시간대/DST 영향을 덜 받도록
 * Date.UTC 기준으로 날짜만 비교
 */
export const getDifferenceInDays = (
  fromDate,
  toDate,
) => {
  const from = startOfDay(fromDate);
  const to = startOfDay(toDate);

  const fromUTC = Date.UTC(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
  );

  const toUTC = Date.UTC(
    to.getFullYear(),
    to.getMonth(),
    to.getDate(),
  );

  return Math.round(
    (toUTC - fromUTC) / DAY_MS,
  );
};

/**
 * 프리셋 날짜 생성
 */
export const createPresetDates = today => ({
  [DATE_PRESET.WEEK]:
    addDays(today, 7),

  [DATE_PRESET.MONTH]:
    addMonthsClamped(today, 1),

  [DATE_PRESET.YEAR]:
    addYearsClamped(today, 1),
});

export const getPresetByDate = ({
  selectedDate,
  presetDates,
}) => {
  if (!selectedDate) {
    return null;
  }

  return (
    Object.values(DATE_PRESET).find(
      preset =>
        isSameDate(
          selectedDate,
          presetDates[preset],
        ),
    ) ?? null
  );
};

/**
 * ListHeader + 하단 선택 버튼 문구 생성
 */
export const createDateSelectCopy = ({
  today,
  selectedDate,
  presetDates,
}) => {
  if (!selectedDate) {
    return {
      title:
        '편지가 도착할 날짜를 선택해 주세요.',
      informativeText: undefined,
      confirmLabel:
        '날짜 선택은 최대 1년까지 가능합니다.',
    };
  }

  const matchedPreset =
    getPresetByDate({
      selectedDate,
      presetDates,
    });

  const relativeText = matchedPreset
    ? DATE_PRESET_LABEL[matchedPreset]
    : `${getDifferenceInDays(
      today,
      selectedDate,
    )}일 뒤`;

  const year =
    selectedDate.getFullYear();

  const month = String(
    selectedDate.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    selectedDate.getDate(),
  ).padStart(2, '0');

  return {
    informativeText:
      `${relativeText} 0시`,
    title:
      '에 편지가 도착합니다.',
    confirmLabel:
      `${year}년 ${month}월 ${day}일 선택`,
  };
};