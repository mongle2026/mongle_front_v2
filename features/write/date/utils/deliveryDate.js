const KOREA_TIMEZONE_OFFSET = '+09:00';

const pad2 = value =>
  String(value).padStart(2, '0');

export const getDateString = value => {
  if (!value) {
    return null;
  }

  // Calendar가 { dateString: '2026-08-08' } 형태로 주는 경우
  if (value?.dateString) {
    return getDateString(
      value.dateString,
    );
  }

  // { year, month, day } 형태
  if (
    typeof value === 'object' &&
    Number.isFinite(value.year) &&
    Number.isFinite(value.month) &&
    Number.isFinite(value.day)
  ) {
    return [
      value.year,
      pad2(value.month),
      pad2(value.day),
    ].join('-');
  }

  // Date 객체
  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {
    return [
      value.getFullYear(),
      pad2(value.getMonth() + 1),
      pad2(value.getDate()),
    ].join('-');
  }

  // YYYY-MM-DD 또는 ISO datetime 문자열
  if (typeof value === 'string') {
    const match = value.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/,
    );

    if (!match) {
      return null;
    }

    const [, year, month, day] =
      match;

    return [
      year,
      pad2(month),
      pad2(day),
    ].join('-');
  }

  return null;
};

/**
 * 백엔드 전달용
 *
 * 2026-08-08
 * ->
 * 2026-08-08T00:00:00+09:00
 */
export const toDeliveryAt = date => {
  const dateString =
    getDateString(date);

  if (!dateString) {
    return null;
  }

  return `${dateString}T00:00:00${KOREA_TIMEZONE_OFFSET}`;
};

/**
 * 화면 표시용
 *
 * 2026-08-08T00:00:00+09:00
 * ->
 * 26.08.08에 도착
 */
export const formatDeliveryDateLabel =
  deliveryAt => {
    const dateString =
      getDateString(deliveryAt);

    if (!dateString) {
      return '';
    }

    const [year, month, day] =
      dateString.split('-');

    return `${year.slice(-2)}.${month}.${day}에 도착`;
  };