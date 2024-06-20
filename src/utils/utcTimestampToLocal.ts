import type { UTCTimestamp } from 'lightweight-charts';

export default function utcTimestampToLocal(originalTime: UTCTimestamp) {
  const d = new Date(originalTime * 1000);
  return Math.round(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds(),
    ) / 1000,
  ) as UTCTimestamp;
}
