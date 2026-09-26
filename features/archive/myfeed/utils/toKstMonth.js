const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// ISO(UTC) → 한국 시간 기준 'YYYY-MM'. 서버의 월 묶음(/feed/me/months)과 같은 기준
export const toKstMonth = isoString => {
  const time = new Date(isoString).getTime();
  if (Number.isNaN(time)) return '';

  return new Date(time + KST_OFFSET_MS).toISOString().slice(0, 7);
};
