export const won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`;

export const dateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

export const distance = (meters) =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`;

export const duration = (seconds) => {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min}분`;
  return `${Math.floor(min / 60)}시간 ${min % 60}분`;
};
