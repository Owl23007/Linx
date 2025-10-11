/**
 * 字符串处理工具
 */

/**
 * 高亮关键词
 * @param text 原文本
 * @param keyword 关键词
 * @param className CSS类名
 */
export function highlightKeyword(
  text: string,
  keyword: string,
  className = 'highlight'
): string {
  if (!keyword) return text;

  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');

  return text.replace(regex, `<span class="${className}">$1</span>`);
}

/**
 * 转义正则表达式特殊字符
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
}

/**
 * 截断文本
 * @param text 原文本
 * @param maxLength 最大长度
 * @param suffix 后缀（默认：...）
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 移除HTML标签
 */
export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  return div.textContent || div.innerText || '';
}

/**
 * 转换表情符号为图片
 * @param text 文本
 * @param emojiMap 表情映射表
 */
export function parseEmoji(text: string, emojiMap: Record<string, string>): string {
  let result = text;
  for (const [code, url] of Object.entries(emojiMap)) {
    const regex = new RegExp(escapeRegExp(code), 'g');
    result = result.replace(regex, `<img src="${url}" class="emoji" alt="${code}" />`);
  }

  return result;
}

/**
 * 解析URL（将文本中的URL转换为链接）
 */
export function parseUrls(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

/**
 * 解析提及（@用户名）
 */
export function parseMentions(text: string): string {
  const mentionRegex = /@(\w+)/g;

  return text.replace(
    mentionRegex,
    '<span class="mention" data-username="$1">@$1</span>'
  );
}

/**
 * 生成随机字符串
 * @param length 长度
 */
export function randomString(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * 生成UUID
 */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
}

/**
 * 首字母大写
 */
export function capitalize(str: string): string {
  if (!str) return '';

  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 驼峰转短横线
 */
export function kebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * 短横线转驼峰
 */
export function camelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * 获取字符串字节长度（中文算2个字节）
 */
export function getByteLength(str: string): number {
  let length = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x007f) {
      length += 1;
    } else if (code <= 0x07ff) {
      length += 2;
    } else if (code <= 0xffff) {
      length += 3;
    } else {
      length += 4;
    }
  }

  return length;
}

/**
 * 按字节截断字符串
 */
export function truncateByBytes(str: string, maxBytes: number, suffix = '...'): string {
  let length = 0;
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    let charBytes = 1;

    if (code <= 0x007f) {
      charBytes = 1;
    } else if (code <= 0x07ff) {
      charBytes = 2;
    } else if (code <= 0xffff) {
      charBytes = 3;
    } else {
      charBytes = 4;
    }

    if (length + charBytes > maxBytes) {
      return result + suffix;
    }

    length += charBytes;
    result += str[i];
  }

  return result;
}
