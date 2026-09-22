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

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// 백엔드 값 → 현재 시각 기준 상대 표기
// 1분 미만 "1분 전" / 60분 미만 "n분 전" / 24시간 미만 "n시간 전"(내림) / 그 이상 "yy.mm.dd hh:mm"
// 24시간 이상일 때 형식은 fallback으로 바꿀 수 있다. (예: formatDate → "yy.mm.dd")
export function formatRelativeDate(value, fallback = formatDateDetail) {
  if (value == null || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);

  const diffMs = Date.now() - date.getTime();

  if (diffMs < MINUTE_MS) return '1분 전';
  if (diffMs < HOUR_MS) return `${Math.floor(diffMs / MINUTE_MS)}분 전`;
  if (diffMs < DAY_MS) return `${Math.floor(diffMs / HOUR_MS)}시간 전`;
  return fallback(date);
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

// 수정된 글인지 (updatedAt이 createdAt보다 이후면 true)
export function isEdited(createdAt, updatedAt) {
  if (!createdAt || !updatedAt) return false;

  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(created) || Number.isNaN(updated)) return false;

  return updated > created;
}
