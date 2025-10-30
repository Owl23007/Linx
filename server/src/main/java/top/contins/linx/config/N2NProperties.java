package top.contins.linx.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * N2N P2P VPN配置属性
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "linx.n2n")
public class N2NProperties {

    /**
     * Supernode地址（格式：ip:port）
     */
    private String supernodeAddress = "127.0.0.1:7777";

    /**
     * 默认社区名称前缀
     */
    private String communityPrefix = "linx";

    /**
     * 虚拟IP地址段（格式：192.168.100.0/24）
     */
    private String virtualIpRange = "192.168.100.0/24";

    /**
     * N2N二进制文件目录
     */
    private String binaryDirectory = "native/n2n";

    /**
     * 进程启动超时（秒）
     */
    private int startupTimeout = 30;

    /**
     * 进程自动重启最大次数
     */
    private int maxRestartAttempts = 3;

    /**
     * 进程健康检查间隔（秒）
     */
    private int healthCheckInterval = 10;

    /**
     * 是否启用加密
     */
    private boolean encryptionEnabled = true;

    /**
     * 日志级别（0-5，0=最少，5=最详细）
     */
    private int logLevel = 2;
}
