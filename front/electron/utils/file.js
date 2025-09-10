import fs from 'fs';
import path from 'path';

export function loadFromFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      // 使用Buffer读取文件，支持大文件
      const buffer = fs.readFileSync(filePath);

      return buffer.toString('utf8').trim();
    }
  } catch (error) {
    console.warn('LOAD_FILE', `读取文件失败: ${error.message}`);
  }

  return null;
}

export function saveToFile(filePath, content) {
  try {
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 将内容转换为Buffer，支持长文本
    const buffer = Buffer.from(content, 'utf8');
    fs.writeFileSync(filePath, buffer);

    return true;
  } catch (error) {
    console.warn('SAVE_FILE', `保存文件失败: ${error.message}`);

    return false;
  }
}

// 导出别名以保持兼容性
export { saveToFile as SaveToFile };
