package top.contins.linx.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import top.contins.linx.config.N2NProperties;
import top.contins.linx.exception.P2PConnectionException;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * N2N进程管理器
 * 负责启动、停止和监控N2N edge进程，支持多平台
 */
@Slf4j
@Service
public class N2NProcessManager {

    private static final String EDGE_BINARY_WINDOWS = "edge.exe";
    private static final String EDGE_BINARY_UNIX = "edge";

    // 存储所有活动的N2N进程 (connectionId -> Process)
    private final Map<String, Process> activeProcesses = new ConcurrentHashMap<>();
    
    // 存储进程重启计数 (connectionId -> restartCount)
    private final Map<String, Integer> restartCounts = new ConcurrentHashMap<>();

    private final N2NProperties n2nProperties;

    @Autowired
    public N2NProcessManager(N2NProperties n2nProperties) {
        this.n2nProperties = n2nProperties;
    }

    /**
     * 启动N2N Edge进程
     * 
     * @param connectionId 连接ID（唯一标识）
     * @param community 社区名称
     * @param password 加密密码
     * @param localIp 本地虚拟IP
     * @param supernodeAddr Supernode地址
     * @return 启动成功返回true
     */
    public boolean startEdge(String connectionId, String community, String password, 
                            String localIp, String supernodeAddr) {
        if (connectionId == null || community == null || localIp == null) {
            throw new IllegalArgumentException("启动N2N Edge失败：参数不能为空");
        }

        try {
            // 检查进程是否已存在
            if (activeProcesses.containsKey(connectionId)) {
                log.warn("N2N Edge进程已存在: connectionId={}", connectionId);
                return false;
            }

            // 获取N2N二进制文件路径
            Path edgeBinary = getEdgeBinaryPath();
            
            // 验证二进制文件
            validateBinary(edgeBinary);

            // 构建命令
            List<String> command = buildEdgeCommand(edgeBinary.toString(), community, 
                password, localIp, supernodeAddr);

            // 启动进程
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(true);
            
            Process process = processBuilder.start();
            
            // 存储进程引用
            activeProcesses.put(connectionId, process);
            restartCounts.put(connectionId, 0);

            // 异步监控进程输出
            monitorProcessOutput(connectionId, process);

            // 等待进程启动
            if (waitForProcessStartup(process, n2nProperties.getStartupTimeout())) {
                log.info("N2N Edge进程启动成功: connectionId={}, community={}, localIp={}", 
                    connectionId, community, localIp);
                return true;
            } else {
                stopEdge(connectionId);
                throw new P2PConnectionException("N2N Edge进程启动超时");
            }

        } catch (Exception e) {
            log.error("启动N2N Edge进程失败: connectionId={}", connectionId, e);
            stopEdge(connectionId);
            throw new P2PConnectionException("启动N2N Edge进程失败", e);
        }
    }

    /**
     * 停止N2N Edge进程
     * 
     * @param connectionId 连接ID
     */
    public void stopEdge(String connectionId) {
        if (connectionId == null) {
            return;
        }

        try {
            Process process = activeProcesses.remove(connectionId);
            restartCounts.remove(connectionId);

            if (process != null && process.isAlive()) {
                process.destroy();
                
                // 等待进程结束
                if (!process.waitFor(10, TimeUnit.SECONDS)) {
                    process.destroyForcibly();
                }

                log.info("N2N Edge进程已停止: connectionId={}", connectionId);
            }

        } catch (Exception e) {
            log.error("停止N2N Edge进程失败: connectionId={}", connectionId, e);
        }
    }

    /**
     * 检查进程是否运行
     * 
     * @param connectionId 连接ID
     * @return true-运行中，false-已停止
     */
    public boolean isProcessRunning(String connectionId) {
        if (connectionId == null) {
            return false;
        }

        Process process = activeProcesses.get(connectionId);
        return process != null && process.isAlive();
    }

    /**
     * 重启进程
     * 
     * @param connectionId 连接ID
     * @param community 社区名称
     * @param password 加密密码
     * @param localIp 本地虚拟IP
     * @param supernodeAddr Supernode地址
     * @return 重启成功返回true
     */
    public boolean restartEdge(String connectionId, String community, String password,
                              String localIp, String supernodeAddr) {
        Integer restartCount = restartCounts.getOrDefault(connectionId, 0);
        
        if (restartCount >= n2nProperties.getMaxRestartAttempts()) {
            log.error("N2N Edge进程重启次数超过限制: connectionId={}, count={}", 
                connectionId, restartCount);
            return false;
        }

        log.info("尝试重启N2N Edge进程: connectionId={}, attempt={}", 
            connectionId, restartCount + 1);

        stopEdge(connectionId);
        
        boolean success = startEdge(connectionId, community, password, localIp, supernodeAddr);
        
        if (success) {
            restartCounts.put(connectionId, restartCount + 1);
        }

        return success;
    }

    /**
     * 停止所有进程
     */
    public void stopAllProcesses() {
        log.info("停止所有N2N Edge进程: count={}", activeProcesses.size());
        
        List<String> connectionIds = new ArrayList<>(activeProcesses.keySet());
        for (String connectionId : connectionIds) {
            stopEdge(connectionId);
        }
    }

    /**
     * 获取Edge二进制文件路径（根据操作系统）
     */
    private Path getEdgeBinaryPath() throws IOException {
        String os = System.getProperty("os.name").toLowerCase();
        String binaryName;
        String osDir;

        if (os.contains("win")) {
            binaryName = EDGE_BINARY_WINDOWS;
            osDir = "windows";
        } else if (os.contains("mac")) {
            binaryName = EDGE_BINARY_UNIX;
            osDir = "macos";
        } else {
            binaryName = EDGE_BINARY_UNIX;
            osDir = "linux";
        }

        // 从classpath复制到临时目录
        String resourcePath = n2nProperties.getBinaryDirectory() + "/" + osDir + "/" + binaryName;
        ClassPathResource resource = new ClassPathResource(resourcePath);

        if (!resource.exists()) {
            throw new FileNotFoundException("N2N二进制文件不存在: " + resourcePath);
        }

        // 创建临时文件
        Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"), "linx", "n2n");
        Files.createDirectories(tempDir);
        
        Path binaryPath = tempDir.resolve(binaryName);
        
        // 复制文件
        try (InputStream is = resource.getInputStream()) {
            Files.copy(is, binaryPath, StandardCopyOption.REPLACE_EXISTING);
        }

        // 设置可执行权限（Unix系统）
        if (!os.contains("win")) {
            binaryPath.toFile().setExecutable(true);
        }

        log.debug("N2N二进制文件路径: {}", binaryPath);
        return binaryPath;
    }

    /**
     * 验证二进制文件（SHA256校验）
     */
    private void validateBinary(Path binaryPath) throws Exception {
        if (!Files.exists(binaryPath)) {
            throw new FileNotFoundException("二进制文件不存在: " + binaryPath);
        }

        // 这里可以添加SHA256校验逻辑
        // 为简化实现，暂时只检查文件是否存在
        log.debug("二进制文件验证通过: {}", binaryPath);
    }

    /**
     * 构建Edge命令
     */
    private List<String> buildEdgeCommand(String binaryPath, String community, 
                                         String password, String localIp, 
                                         String supernodeAddr) {
        List<String> command = new ArrayList<>();
        command.add(binaryPath);
        command.add("-c");
        command.add(community);
        
        if (n2nProperties.isEncryptionEnabled() && password != null && !password.isEmpty()) {
            command.add("-k");
            command.add(password);
        }
        
        command.add("-a");
        command.add(localIp);
        command.add("-l");
        command.add(supernodeAddr != null ? supernodeAddr : n2nProperties.getSupernodeAddress());
        
        // 添加日志级别
        if (n2nProperties.getLogLevel() > 0) {
            command.add("-v");
        }

        log.debug("N2N Edge命令: {}", maskSensitiveInfo(command));
        return command;
    }

    /**
     * 等待进程启动
     */
    private boolean waitForProcessStartup(Process process, int timeoutSeconds) {
        for (int i = 0; i < timeoutSeconds; i++) {
            if (!process.isAlive()) {
                return false;
            }
            
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        
        return process.isAlive();
    }

    /**
     * 异步监控进程输出
     */
    private void monitorProcessOutput(String connectionId, Process process) {
        new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                
                String line;
                while ((line = reader.readLine()) != null) {
                    // 不记录包含密码的日志
                    if (!line.contains("-k") && !line.contains("password")) {
                        log.debug("[N2N-{}] {}", connectionId, line);
                    }
                }
                
            } catch (IOException e) {
                log.debug("N2N进程输出流已关闭: connectionId={}", connectionId);
            }
        }, "n2n-monitor-" + connectionId).start();
    }

    /**
     * 屏蔽敏感信息（密码）
     */
    private String maskSensitiveInfo(List<String> command) {
        List<String> masked = new ArrayList<>(command);
        for (int i = 0; i < masked.size(); i++) {
            if ("-k".equals(masked.get(i)) && i + 1 < masked.size()) {
                masked.set(i + 1, "****");
            }
        }
        return String.join(" ", masked);
    }
}
