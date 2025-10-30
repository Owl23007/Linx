package top.contins.linx.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

/**
 * 文件服务配置属性
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "linx.file")
public class FileProperties {

    /**
     * 文件存储根目录
     */
    private String storageRoot = "/tmp/linx/files";

    /**
     * 临时上传目录
     */
    private String uploadTempDir = "/tmp/linx/upload";

    /**
     * 分片大小（字节，默认5MB）
     */
    private long chunkSize = 5 * 1024 * 1024;

    /**
     * 最大文件大小（字节，默认1GB）
     */
    private long maxFileSize = 1024 * 1024 * 1024;

    /**
     * 允许的文件类型（MIME类型）
     */
    private List<String> allowedMimeTypes = Arrays.asList(
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/zip",
        "text/plain",
        "application/json"
    );

    /**
     * 禁止的文件扩展名
     */
    private List<String> blockedExtensions = Arrays.asList(
        ".exe", ".bat", ".sh", ".cmd", ".com", ".pif", ".scr", ".vbs", ".js"
    );

    /**
     * 图片压缩质量（0.0-1.0）
     */
    private float imageQuality = 0.85f;

    /**
     * 缩略图宽度
     */
    private int thumbnailWidth = 100;

    /**
     * 缩略图高度
     */
    private int thumbnailHeight = 100;
}
