/**
 * 文件处理工具
 */

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');

  return lastDot === -1 ? '' : filename.slice(lastDot + 1).toLowerCase();
}

/**
 * 判断是否是图片文件
 * @param filename 文件名或扩展名
 */
export function isImageFile(filename: string): boolean {
  const ext = filename.includes('.') ? getFileExtension(filename) : filename;
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

  return imageExts.includes(ext);
}

/**
 * 判断是否是视频文件
 * @param filename 文件名或扩展名
 */
export function isVideoFile(filename: string): boolean {
  const ext = filename.includes('.') ? getFileExtension(filename) : filename;
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];

  return videoExts.includes(ext);
}

/**
 * 判断是否是音频文件
 * @param filename 文件名或扩展名
 */
export function isAudioFile(filename: string): boolean {
  const ext = filename.includes('.') ? getFileExtension(filename) : filename;
  const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];

  return audioExts.includes(ext);
}

/**
 * 判断是否是文档文件
 * @param filename 文件名或扩展名
 */
export function isDocumentFile(filename: string): boolean {
  const ext = filename.includes('.') ? getFileExtension(filename) : filename;
  const docExts = ['doc', 'docx', 'pdf', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];

  return docExts.includes(ext);
}

/**
 * 获取文件类型图标
 * @param filename 文件名
 */
export function getFileIcon(filename: string): string {
  if (isImageFile(filename)) return '🖼️';
  if (isVideoFile(filename)) return '🎬';
  if (isAudioFile(filename)) return '🎵';
  if (isDocumentFile(filename)) return '📄';

  return '📎';
}

/**
 * 读取文件为Base64
 * @param file 文件对象
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 读取文件为文本
 * @param file 文件对象
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * 下载文件
 * @param url 文件URL
 * @param filename 文件名
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 压缩图片
 * @param file 图片文件
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param quality 质量（0-1）
 */
export function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // 计算缩放比例
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('压缩失败'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
