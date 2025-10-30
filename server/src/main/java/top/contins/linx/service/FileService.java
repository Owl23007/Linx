package top.contins.linx.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import top.contins.linx.config.FileProperties;
import top.contins.linx.exception.FileTransferException;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 文件服务
 * 提供文件上传、下载、分片管理等功能
 */
@Slf4j
@Service
public class FileService {

    // 存储上传会话 (uploadId -> UploadSession)
    private final Map<String, UploadSession> uploadSessions = new ConcurrentHashMap<>();

    private final FileProperties fileProperties;

    @Autowired
    public FileService(FileProperties fileProperties) {
        this.fileProperties = fileProperties;
        initializeDirectories();
    }

    /**
     * 初始化目录
     */
    private void initializeDirectories() {
        try {
            Files.createDirectories(Paths.get(fileProperties.getStorageRoot()));
            Files.createDirectories(Paths.get(fileProperties.getUploadTempDir()));
            log.info("文件存储目录已初始化: storage={}, temp={}", 
                fileProperties.getStorageRoot(), fileProperties.getUploadTempDir());
        } catch (IOException e) {
            log.error("初始化文件存储目录失败", e);
        }
    }

    /**
     * 初始化分片上传
     * 
     * @param fileName 文件名
     * @param fileSize 文件大小
     * @param totalChunks 总分片数
     * @return 上传ID
     */
    public String initiateChunkedUpload(String fileName, long fileSize, int totalChunks) {
        if (fileName == null || fileSize <= 0 || totalChunks <= 0) {
            throw new IllegalArgumentException("参数无效");
        }

        // 验证文件大小
        if (fileSize > fileProperties.getMaxFileSize()) {
            throw new FileTransferException("文件大小超过限制: " + fileSize);
        }

        // 验证文件类型
        if (!isFileAllowed(fileName)) {
            throw new FileTransferException("不允许的文件类型: " + fileName);
        }

        try {
            String uploadId = UUID.randomUUID().toString();
            Path tempDir = Paths.get(fileProperties.getUploadTempDir(), uploadId);
            Files.createDirectories(tempDir);

            UploadSession session = new UploadSession(
                uploadId, fileName, fileSize, totalChunks, tempDir.toString()
            );

            uploadSessions.put(uploadId, session);

            log.info("分片上传已初始化: uploadId={}, fileName={}, fileSize={}, chunks={}", 
                uploadId, fileName, fileSize, totalChunks);

            return uploadId;

        } catch (Exception e) {
            log.error("初始化分片上传失败: fileName={}", fileName, e);
            throw new FileTransferException("初始化分片上传失败", e);
        }
    }

    /**
     * 上传文件分片
     * 
     * @param uploadId 上传ID
     * @param chunkIndex 分片索引
     * @param chunk 分片数据
     * @return 是否上传成功
     */
    public boolean uploadChunk(String uploadId, int chunkIndex, MultipartFile chunk) {
        if (uploadId == null || chunk == null) {
            throw new IllegalArgumentException("参数无效");
        }

        UploadSession session = uploadSessions.get(uploadId);
        if (session == null) {
            throw new FileTransferException("上传会话不存在");
        }

        try {
            Path chunkPath = Paths.get(session.tempDir, "chunk_" + chunkIndex);
            chunk.transferTo(chunkPath.toFile());

            session.uploadedChunks.add(chunkIndex);

            log.debug("分片已上传: uploadId={}, chunkIndex={}, progress={}/{}", 
                uploadId, chunkIndex, session.uploadedChunks.size(), session.totalChunks);

            return true;

        } catch (Exception e) {
            log.error("上传分片失败: uploadId={}, chunkIndex={}", uploadId, chunkIndex, e);
            return false;
        }
    }

    /**
     * 完成分片上传，合并文件
     * 
     * @param uploadId 上传ID
     * @return 文件保存路径
     */
    public String completeChunkedUpload(String uploadId) {
        if (uploadId == null) {
            throw new IllegalArgumentException("uploadId不能为空");
        }

        UploadSession session = uploadSessions.get(uploadId);
        if (session == null) {
            throw new FileTransferException("上传会话不存在");
        }

        // 验证所有分片是否上传完成
        if (session.uploadedChunks.size() != session.totalChunks) {
            throw new FileTransferException("分片上传未完成: " + 
                session.uploadedChunks.size() + "/" + session.totalChunks);
        }

        try {
            // 生成唯一文件名
            String fileId = UUID.randomUUID().toString();
            String extension = getFileExtension(session.fileName);
            String savedFileName = fileId + extension;
            
            Path finalPath = Paths.get(fileProperties.getStorageRoot(), savedFileName);

            // 合并分片
            try (FileOutputStream fos = new FileOutputStream(finalPath.toFile())) {
                for (int i = 0; i < session.totalChunks; i++) {
                    Path chunkPath = Paths.get(session.tempDir, "chunk_" + i);
                    Files.copy(chunkPath, fos);
                }
            }

            // 清理临时文件
            cleanupTempFiles(uploadId);

            log.info("分片上传已完成: uploadId={}, savedPath={}", uploadId, finalPath);

            return savedFileName;

        } catch (Exception e) {
            log.error("完成分片上传失败: uploadId={}", uploadId, e);
            throw new FileTransferException("完成分片上传失败", e);
        }
    }

    /**
     * 取消上传
     * 
     * @param uploadId 上传ID
     */
    public void cancelUpload(String uploadId) {
        if (uploadId == null) {
            return;
        }

        cleanupTempFiles(uploadId);
        uploadSessions.remove(uploadId);

        log.info("上传已取消: uploadId={}", uploadId);
    }

    /**
     * 获取上传进度
     * 
     * @param uploadId 上传ID
     * @return 进度百分比（0-100）
     */
    public double getUploadProgress(String uploadId) {
        UploadSession session = uploadSessions.get(uploadId);
        if (session == null) {
            return 0;
        }

        return (double) session.uploadedChunks.size() / session.totalChunks * 100;
    }

    /**
     * 上传单个文件（非分片）
     * 
     * @param file 文件
     * @return 文件保存路径
     */
    public String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("文件为空");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("文件名为空");
        }

        // 验证文件大小
        if (file.getSize() > fileProperties.getMaxFileSize()) {
            throw new FileTransferException("文件大小超过限制");
        }

        // 验证文件类型
        if (!isFileAllowed(originalFilename)) {
            throw new FileTransferException("不允许的文件类型");
        }

        try {
            String fileId = UUID.randomUUID().toString();
            String extension = getFileExtension(originalFilename);
            String savedFileName = fileId + extension;
            
            Path filePath = Paths.get(fileProperties.getStorageRoot(), savedFileName);
            file.transferTo(filePath.toFile());

            log.info("文件已上传: originalName={}, savedName={}, size={}", 
                originalFilename, savedFileName, file.getSize());

            return savedFileName;

        } catch (Exception e) {
            log.error("上传文件失败: fileName={}", originalFilename, e);
            throw new FileTransferException("上传文件失败", e);
        }
    }

    /**
     * 验证文件是否允许上传
     */
    private boolean isFileAllowed(String fileName) {
        if (fileName == null) {
            return false;
        }

        // 检查文件扩展名
        String extension = getFileExtension(fileName).toLowerCase();
        if (fileProperties.getBlockedExtensions().contains(extension)) {
            return false;
        }

        return true;
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String fileName) {
        if (fileName == null) {
            return "";
        }

        int lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0) {
            return fileName.substring(lastDot);
        }

        return "";
    }

    /**
     * 清理临时文件
     */
    private void cleanupTempFiles(String uploadId) {
        try {
            UploadSession session = uploadSessions.get(uploadId);
            if (session != null) {
                Path tempDir = Paths.get(session.tempDir);
                if (Files.exists(tempDir)) {
                    Files.walk(tempDir)
                        .sorted(Comparator.reverseOrder())
                        .forEach(path -> {
                            try {
                                Files.delete(path);
                            } catch (IOException e) {
                                log.warn("删除临时文件失败: {}", path, e);
                            }
                        });
                }
            }
        } catch (Exception e) {
            log.error("清理临时文件失败: uploadId={}", uploadId, e);
        }
    }

    /**
     * 上传会话
     */
    private static class UploadSession {
        final String uploadId;
        final String fileName;
        final long fileSize;
        final int totalChunks;
        final String tempDir;
        final Set<Integer> uploadedChunks;
        final long startTime;

        UploadSession(String uploadId, String fileName, long fileSize, 
                     int totalChunks, String tempDir) {
            this.uploadId = uploadId;
            this.fileName = fileName;
            this.fileSize = fileSize;
            this.totalChunks = totalChunks;
            this.tempDir = tempDir;
            this.uploadedChunks = new HashSet<>();
            this.startTime = System.currentTimeMillis();
        }
    }
}
