// ============================================
// 日期工具函数
// ============================================

export const padZero = (n: number): string => n < 10 ? `0${n}` : `${n}`;

export const formatDate = (date: Date): string => {
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`;
};

export const formatDateCN = (date: Date): string => {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

export const formatTime = (date: Date): string => {
  return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
};

export const parseDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const diffDays = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date1.getTime() - date2.getTime()) / oneDay);
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear()
    && date1.getMonth() === date2.getMonth()
    && date1.getDate() === date2.getDate();
};

export const isToday = (dateStr: string): boolean => {
  return isSameDay(parseDate(dateStr), new Date());
};

export const getMonthDays = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

export const getRelativeDateStr = (dateStr: string): string => {
  const date = parseDate(dateStr);
  const today = new Date();
  const diff = diffDays(date, today);
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  if (diff === -1) return '昨天';
  if (diff > 0 && diff <= 7) return `${diff}天后`;
  if (diff < 0 && diff >= -7) return `${Math.abs(diff)}天前`;
  return formatDateCN(date);
};

export const getWeekdayCN = (date: Date): string => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()];
};

export const generateDateRange = (startDate: string, days: number): string[] => {
  const dates: string[] = [];
  const start = parseDate(startDate);
  for (let i = 0; i < days; i++) {
    dates.push(formatDate(addDays(start, i)));
  }
  return dates;
};
