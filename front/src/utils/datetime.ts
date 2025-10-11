/**
 * 日期时间格式化工具
 */

/**
 * 格式化日期时间
 * @param date 日期字符串或Date对象
 * @param format 格式（默认：YYYY-MM-DD HH:mm:ss）
 */
export function formatDateTime(
  date: string | Date,
  format = 'YYYY-MM-DD HH:mm:ss'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化为相对时间（如：刚刚、5分钟前、昨天等）
 * @param date 日期字符串或Date对象
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) {
    return '';
  }

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return '刚刚';
  }

  if (minutes < 60) {
    return `${minutes}分钟前`;
  }

  if (hours < 24) {
    return `${hours}小时前`;
  }

  if (days === 1) {
    return `昨天 ${formatDateTime(d, 'HH:mm')}`;
  }

  if (days < 7) {
    return `${days}天前`;
  }

  // 超过7天显示具体日期
  const currentYear = now.getFullYear();
  const targetYear = d.getFullYear();

  if (currentYear === targetYear) {
    return formatDateTime(d, 'MM-DD HH:mm');
  }

  return formatDateTime(d, 'YYYY-MM-DD');
}

/**
 * 格式化聊天时间（智能显示）
 * @param date 日期字符串或Date对象
 */
export function formatChatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) {
    return '';
  }

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  // 今天：只显示时间
  if (hours < 24 && now.getDate() === d.getDate()) {
    return formatDateTime(d, 'HH:mm');
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth()) {
    return `昨天 ${formatDateTime(d, 'HH:mm')}`;
  }

  // 今年：月-日 时:分
  if (d.getFullYear() === now.getFullYear()) {
    return formatDateTime(d, 'MM-DD HH:mm');
  }

  // 往年：年-月-日
  return formatDateTime(d, 'YYYY-MM-DD');
}

/**
 * 判断是否是今天
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/**
 * 判断是否是昨天
 */
export function isYesterday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * 获取时间戳
 */
export function getTimestamp(date?: string | Date): number {
  if (!date) {
    return Date.now();
  }

  const d = typeof date === 'string' ? new Date(date) : date;

  return d.getTime();
}
