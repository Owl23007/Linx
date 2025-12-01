#!/usr/bin/env node

/**
 * SVG to Icon Formats Converter
 * 将 SVG 转换为 PNG、ICO、ICNS 等格式
 *
 * 使用 Sharp 库进行转换，支持生成：
 * - icon.png (512x512) - Linux
 * - icon.ico (多尺寸) - Windows
 * - icon.icns - macOS (需要 ImageMagick)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(__dirname, '..', 'build');
const svgFile = path.join(buildDir, 'icon.svg');

// ICO 文件所需的尺寸
const ICO_SIZES = [256, 128, 96, 64, 48, 32, 24, 16];

console.log('[Icon Converter] Starting SVG to Icon conversion...');
console.log(`Build directory: ${buildDir}`);

// 检查 SVG 文件是否存在
if (!fs.existsSync(svgFile)) {
  console.error(`❌ SVG file not found: ${svgFile}`);
  process.exit(1);
}

console.log('✓ SVG file found');

/**
 * 检测可用的 ImageMagick 命令
 * Windows 上新版本使用 magick，旧版本使用 convert
 */
function getImageMagickCommand() {
  // 尝试 magick (新版 ImageMagick 7+)
  try {
    execSync('magick --version', { stdio: 'ignore' });

    return 'magick';
  } catch {
    // 忽略
  }

  // 尝试 convert (旧版 ImageMagick 6)
  try {
    execSync('convert --version', { stdio: 'ignore' });

    return 'convert';
  } catch {
    // 忽略
  }

  return null;
}

/**
 * 使用 Sharp 生成标准 ICO 文件
 * ICO 格式包含多个尺寸的 PNG 图像
 */
async function generateIcoWithSharp(svgPath, icoPath) {
  const sharp = (await import('sharp')).default;

  // 生成各种尺寸的 PNG 数据
  const images = [];
  for (const size of ICO_SIZES) {
    const pngBuffer = await sharp(svgPath)
      .resize(size, size)
      .png()
      .toBuffer();
    images.push({ size, buffer: pngBuffer });
  }

  // 创建 ICO 文件
  // ICO 文件格式: Header (6 bytes) + Directory entries (16 bytes each) + Image data
  const headerSize = 6;
  const dirEntrySize = 16;
  const numImages = images.length;

  // 计算每个图像数据的偏移量
  let dataOffset = headerSize + (dirEntrySize * numImages);
  const imageEntries = images.map(img => {
    const entry = {
      size: img.size,
      buffer: img.buffer,
      offset: dataOffset
    };
    dataOffset += img.buffer.length;

    return entry;
  });

  // ICO Header
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);        // Reserved, must be 0
  header.writeUInt16LE(1, 2);        // Image type: 1 = ICO
  header.writeUInt16LE(numImages, 4); // Number of images

  // Directory entries
  const directories = imageEntries.map(entry => {
    const dir = Buffer.alloc(dirEntrySize);
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, 0);  // Width (0 = 256)
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, 1);  // Height (0 = 256)
    dir.writeUInt8(0, 2);                                    // Color palette (0 = no palette)
    dir.writeUInt8(0, 3);                                    // Reserved
    dir.writeUInt16LE(1, 4);                                 // Color planes
    dir.writeUInt16LE(32, 6);                                // Bits per pixel
    dir.writeUInt32LE(entry.buffer.length, 8);               // Image data size
    dir.writeUInt32LE(entry.offset, 12);                     // Image data offset

    return dir;
  });

  // 合并所有数据
  const icoBuffer = Buffer.concat([
    header,
    ...directories,
    ...imageEntries.map(e => e.buffer)
  ]);

  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`✓ icon.ico created (${numImages} sizes: ${ICO_SIZES.join(', ')}px)`);
}

// 主转换函数
async function convertIcons() {
  let pngCreated = false;
  let icoCreated = false;
  let icnsCreated = false;

  // 首先尝试使用 Sharp（推荐方式）
  try {
    const sharp = (await import('sharp')).default;
    console.log('✓ Sharp found, using for conversion...');

    // 转换为 PNG (512x512) - Linux 使用
    await sharp(svgFile)
      .resize(512, 512)
      .png()
      .toFile(path.join(buildDir, 'icon.png'));
    console.log('✓ icon.png created (512x512)');
    pngCreated = true;

    // 生成多尺寸 ICO 文件 - Windows 使用
    await generateIcoWithSharp(svgFile, path.join(buildDir, 'icon.ico'));
    icoCreated = true;

  } catch (sharpError) {
    console.warn('⚠ Sharp conversion failed:', sharpError.message);
  }

  // 尝试使用 ImageMagick 生成 ICNS (macOS)
  const magickCmd = getImageMagickCommand();
  if (magickCmd) {
    console.log(`✓ ImageMagick found (${magickCmd})`);

    // 如果 Sharp 失败，使用 ImageMagick 作为后备
    if (!pngCreated) {
      try {
        execSync(`${magickCmd} "${svgFile}" -background none -resize 512x512 "${path.join(buildDir, 'icon.png')}"`, {
          stdio: 'inherit'
        });
        console.log('✓ icon.png created with ImageMagick');
        pngCreated = true;
      } catch  {
        console.warn('⚠ Failed to create icon.png with ImageMagick');
      }
    }

    if (!icoCreated) {
      try {
        execSync(`${magickCmd} "${svgFile}" -background none -define icon:auto-resize=256,128,96,64,48,32,16 "${path.join(buildDir, 'icon.ico')}"`, {
          stdio: 'inherit'
        });
        console.log('✓ icon.ico created with ImageMagick');
        icoCreated = true;
      } catch {
        console.warn('⚠ Failed to create icon.ico with ImageMagick');
      }
    }

    // ICNS 只能通过 ImageMagick 生成
    try {
      execSync(`${magickCmd} "${svgFile}" -background none -resize 512x512 "${path.join(buildDir, 'icon.icns')}"`, {
        stdio: 'inherit'
      });
      console.log('✓ icon.icns created');
      icnsCreated = true;
    } catch {
      console.warn('⚠ Failed to create icon.icns');
    }
  } else {
    console.warn('⚠ ImageMagick not found');
  }

  // 输出结果摘要
  console.log('\n--- Conversion Summary ---');
  console.log(`PNG (Linux):   ${pngCreated ? '✓ Created' : 'x Failed'}`);
  console.log(`ICO (Windows): ${icoCreated ? '✓ Created' : 'x Failed'}`);
  console.log(`ICNS (macOS):  ${icnsCreated ? '✓ Created' : 'x Not created (requires ImageMagick)'}`);

  if (!pngCreated && !icoCreated) {
    console.error('\nx No icons were created');
    console.log('\n Install one of the following:');
    console.log('1. Sharp (npm): pnpm add -D sharp');
    console.log('2. ImageMagick: https://imagemagick.org/script/download.php#windows');
    console.log('\n Or use online converters:');
    console.log('- PNG/ICO: https://convertio.co/svg-ico/');
    console.log('- PNG/ICNS: https://icoconvert.com/');
    console.log('\nPlace converted icons in: ' + buildDir);
    process.exit(1);
  }

  if (!icnsCreated) {
    console.log('\nFor ICNS (macOS builds):');
    console.log('   Install ImageMagick: https://imagemagick.org/script/download.php');
    console.log('   Or use online converter: https://cloudconvert.com/svg-to-icns');
  }

  console.log('\n✓ Icon conversion complete!');
}

// 运行转换
convertIcons().catch(err => {
  console.error('Conversion error:', err);
  process.exit(1);
});
