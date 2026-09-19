// 백엔드 값(Date | ISO 문자열 | timestamp) → "yy.mm.dd"
export function formatDate(value) {
  if (value == null || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '';
  }
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

// 백엔드 값 → "yy.mm.dd hh:mm"
export function formatDateDetail(isoString) {
  const date = new Date(isoString);
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(isoString)} ${hh}:${min}`;
}

// 시간을 제거한 날짜 (그날 0시)
export function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

// 같은 날짜인지 비교 (둘 중 하나라도 없으면 false)
export function isSameDate(dateA, dateB) {
  if (!dateA || !dateB) return false;

  const a = startOfDay(dateA);
  const b = startOfDay(dateB);

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
