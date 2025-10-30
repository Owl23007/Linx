package top.contins.linx.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import top.contins.linx.config.FileProperties;
import top.contins.linx.exception.FileTransferException;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * 图片处理服务
 * 提供图片压缩、缩略图生成等功能
 */
@Slf4j
@Service
public class ImageProcessService {

    private final FileProperties fileProperties;

    @Autowired
    public ImageProcessService(FileProperties fileProperties) {
        this.fileProperties = fileProperties;
    }

    /**
     * 压缩图片
     * 
     * @param sourceFile 源文件路径
     * @param quality 压缩质量（0.0-1.0）
     * @return 压缩后的文件路径
     */
    public String compressImage(String sourceFile, float quality) {
        if (sourceFile == null) {
            throw new IllegalArgumentException("源文件路径不能为空");
        }

        try {
            Path sourcePath = Paths.get(fileProperties.getStorageRoot(), sourceFile);
            if (!Files.exists(sourcePath)) {
                throw new FileTransferException("源文件不存在: " + sourceFile);
            }

            // 读取原图
            BufferedImage originalImage = ImageIO.read(sourcePath.toFile());
            if (originalImage == null) {
                throw new FileTransferException("无法读取图片: " + sourceFile);
            }

            // 生成压缩后的文件名
            String compressedFileName = generateFileName("webp");
            Path compressedPath = Paths.get(fileProperties.getStorageRoot(), compressedFileName);

            // 压缩为WebP格式（这里简化为JPEG，实际需要WebP库）
            // 实际生产环境建议使用 webp-imageio 或其他WebP库
            boolean written = ImageIO.write(originalImage, "jpg", compressedPath.toFile());
            
            if (!written) {
                throw new FileTransferException("图片压缩失败");
            }

            log.info("图片已压缩: source={}, compressed={}, quality={}", 
                sourceFile, compressedFileName, quality);

            return compressedFileName;

        } catch (Exception e) {
            log.error("压缩图片失败: sourceFile={}", sourceFile, e);
            throw new FileTransferException("压缩图片失败", e);
        }
    }

    /**
     * 生成缩略图
     * 
     * @param sourceFile 源文件路径
     * @param width 缩略图宽度
     * @param height 缩略图高度
     * @return 缩略图文件路径
     */
    public String generateThumbnail(String sourceFile, int width, int height) {
        if (sourceFile == null) {
            throw new IllegalArgumentException("源文件路径不能为空");
        }

        if (width <= 0 || height <= 0) {
            width = fileProperties.getThumbnailWidth();
            height = fileProperties.getThumbnailHeight();
        }

        try {
            Path sourcePath = Paths.get(fileProperties.getStorageRoot(), sourceFile);
            if (!Files.exists(sourcePath)) {
                throw new FileTransferException("源文件不存在: " + sourceFile);
            }

            // 读取原图
            BufferedImage originalImage = ImageIO.read(sourcePath.toFile());
            if (originalImage == null) {
                throw new FileTransferException("无法读取图片: " + sourceFile);
            }

            // 创建缩略图
            BufferedImage thumbnail = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = thumbnail.createGraphics();
            
            // 设置高质量渲染
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, 
                RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, 
                RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, 
                RenderingHints.VALUE_ANTIALIAS_ON);

            // 绘制缩略图
            g.drawImage(originalImage, 0, 0, width, height, null);
            g.dispose();

            // 保存缩略图
            String thumbnailFileName = generateFileName("jpg");
            Path thumbnailPath = Paths.get(fileProperties.getStorageRoot(), thumbnailFileName);
            
            boolean written = ImageIO.write(thumbnail, "jpg", thumbnailPath.toFile());
            
            if (!written) {
                throw new FileTransferException("生成缩略图失败");
            }

            log.info("缩略图已生成: source={}, thumbnail={}, size={}x{}", 
                sourceFile, thumbnailFileName, width, height);

            return thumbnailFileName;

        } catch (Exception e) {
            log.error("生成缩略图失败: sourceFile={}", sourceFile, e);
            throw new FileTransferException("生成缩略图失败", e);
        }
    }

    /**
     * 生成缩略图（使用默认尺寸）
     * 
     * @param sourceFile 源文件路径
     * @return 缩略图文件路径
     */
    public String generateThumbnail(String sourceFile) {
        return generateThumbnail(sourceFile, 
            fileProperties.getThumbnailWidth(), 
            fileProperties.getThumbnailHeight());
    }

    /**
     * 压缩并生成缩略图
     * 
     * @param sourceFile 源文件路径
     * @return 包含压缩图和缩略图路径的数组 [压缩图, 缩略图]
     */
    public String[] compressAndGenerateThumbnail(String sourceFile) {
        String compressed = compressImage(sourceFile, fileProperties.getImageQuality());
        String thumbnail = generateThumbnail(sourceFile);
        
        return new String[] { compressed, thumbnail };
    }

    /**
     * 验证是否为图片文件
     * 
     * @param fileName 文件名
     * @return true-是图片，false-不是图片
     */
    public boolean isImageFile(String fileName) {
        if (fileName == null) {
            return false;
        }

        String lowerCase = fileName.toLowerCase();
        return lowerCase.endsWith(".jpg") || 
               lowerCase.endsWith(".jpeg") || 
               lowerCase.endsWith(".png") || 
               lowerCase.endsWith(".gif") || 
               lowerCase.endsWith(".webp") ||
               lowerCase.endsWith(".bmp");
    }

    /**
     * 获取图片尺寸
     * 
     * @param fileName 文件名
     * @return 尺寸数组 [width, height]，获取失败返回null
     */
    public int[] getImageDimensions(String fileName) {
        try {
            Path imagePath = Paths.get(fileProperties.getStorageRoot(), fileName);
            if (!Files.exists(imagePath)) {
                return null;
            }

            BufferedImage image = ImageIO.read(imagePath.toFile());
            if (image == null) {
                return null;
            }

            return new int[] { image.getWidth(), image.getHeight() };

        } catch (IOException e) {
            log.error("获取图片尺寸失败: fileName={}", fileName, e);
            return null;
        }
    }

    /**
     * 生成唯一文件名
     */
    private String generateFileName(String extension) {
        return UUID.randomUUID().toString() + "." + extension;
    }
}
