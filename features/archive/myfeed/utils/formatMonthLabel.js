// 'YYYY-MM' → 'yy년 m월' (예: '2026-05' → '26년 5월')
export const formatMonthLabel = month => {
  const [year, monthNumber] = String(month).split('-');
  if (!year || !monthNumber) return '';

  return `${year.slice(-2)}년 ${Number(monthNumber)}월`;
};
