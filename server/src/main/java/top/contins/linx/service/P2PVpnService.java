package top.contins.linx.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import top.contins.linx.config.N2NProperties;
import top.contins.linx.exception.P2PConnectionException;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * P2P VPN服务
 * 管理用户间的P2P VPN连接生命周期
 */
@Slf4j
@Service
public class P2PVpnService {

    private static final String DEFAULT_IP_PREFIX = "192.168.100.";
    private static final int IP_START = 10;
    private static final int IP_END = 254;

    // 连接信息存储 (connectionId -> ConnectionInfo)
    private final Map<String, P2PConnectionInfo> connections = new ConcurrentHashMap<>();
    
    // IP地址分配计数器
    private final AtomicInteger ipAllocator = new AtomicInteger(IP_START);

    private final N2NProcessManager n2nProcessManager;
    private final N2NProperties n2nProperties;

    @Autowired
    public P2PVpnService(N2NProcessManager n2nProcessManager, N2NProperties n2nProperties) {
        this.n2nProcessManager = n2nProcessManager;
        this.n2nProperties = n2nProperties;
    }

    /**
     * 创建P2P连接
     * 
     * @param userId1 用户1的ID
     * @param userId2 用户2的ID
     * @return 连接信息
     */
    public P2PConnectionInfo createConnection(Long userId1, Long userId2) {
        if (userId1 == null || userId2 == null) {
            throw new IllegalArgumentException("用户ID不能为空");
        }

        if (userId1.equals(userId2)) {
            throw new IllegalArgumentException("不能与自己建立P2P连接");
        }

        try {
            // 生成连接ID和社区名称
            String connectionId = generateConnectionId();
            String community = generateCommunity(userId1, userId2);
            String password = generatePassword();

            // 分配虚拟IP
            String ip1 = allocateVirtualIp();
            String ip2 = allocateVirtualIp();

            P2PConnectionInfo connectionInfo = new P2PConnectionInfo(
                connectionId, community, userId1, userId2, ip1, ip2
            );

            connections.put(connectionId, connectionInfo);

            log.info("P2P连接已创建: connectionId={}, userId1={}, userId2={}, community={}", 
                connectionId, userId1, userId2, community);

            return connectionInfo;

        } catch (Exception e) {
            log.error("创建P2P连接失败: userId1={}, userId2={}", userId1, userId2, e);
            throw new P2PConnectionException("创建P2P连接失败", e);
        }
    }

    /**
     * 启动P2P连接（为指定用户启动edge进程）
     * 
     * @param connectionId 连接ID
     * @param userId 用户ID
     * @param password 加密密码
     * @return 启动成功返回true
     */
    public boolean startConnection(String connectionId, Long userId, String password) {
        if (connectionId == null || userId == null) {
            throw new IllegalArgumentException("参数不能为空");
        }

        P2PConnectionInfo connectionInfo = connections.get(connectionId);
        if (connectionInfo == null) {
            throw new P2PConnectionException("连接不存在: " + connectionId);
        }

        try {
            String localIp;
            if (userId.equals(connectionInfo.userId1)) {
                localIp = connectionInfo.virtualIp1;
            } else if (userId.equals(connectionInfo.userId2)) {
                localIp = connectionInfo.virtualIp2;
            } else {
                throw new P2PConnectionException("用户不属于此连接");
            }

            // 为用户启动N2N Edge进程
            String processId = connectionId + "-" + userId;
            boolean started = n2nProcessManager.startEdge(
                processId,
                connectionInfo.community,
                password,
                localIp,
                n2nProperties.getSupernodeAddress()
            );

            if (started) {
                if (userId.equals(connectionInfo.userId1)) {
                    connectionInfo.user1Connected = true;
                } else {
                    connectionInfo.user2Connected = true;
                }
                
                log.info("用户P2P连接已启动: connectionId={}, userId={}, localIp={}", 
                    connectionId, userId, localIp);
            }

            return started;

        } catch (Exception e) {
            log.error("启动P2P连接失败: connectionId={}, userId={}", connectionId, userId, e);
            throw new P2PConnectionException("启动P2P连接失败", e);
        }
    }

    /**
     * 停止P2P连接
     * 
     * @param connectionId 连接ID
     */
    public void stopConnection(String connectionId) {
        if (connectionId == null) {
            return;
        }

        P2PConnectionInfo connectionInfo = connections.remove(connectionId);
        if (connectionInfo == null) {
            log.warn("连接不存在: connectionId={}", connectionId);
            return;
        }

        try {
            // 停止两个用户的edge进程
            String processId1 = connectionId + "-" + connectionInfo.userId1;
            String processId2 = connectionId + "-" + connectionInfo.userId2;

            n2nProcessManager.stopEdge(processId1);
            n2nProcessManager.stopEdge(processId2);

            // 释放IP地址
            releaseVirtualIp(connectionInfo.virtualIp1);
            releaseVirtualIp(connectionInfo.virtualIp2);

            log.info("P2P连接已停止: connectionId={}", connectionId);

        } catch (Exception e) {
            log.error("停止P2P连接失败: connectionId={}", connectionId, e);
        }
    }

    /**
     * 获取连接状态
     * 
     * @param connectionId 连接ID
     * @return 连接信息
     */
    public P2PConnectionInfo getConnectionInfo(String connectionId) {
        return connections.get(connectionId);
    }

    /**
     * 检查连接是否活跃
     * 
     * @param connectionId 连接ID
     * @return true-活跃，false-不活跃
     */
    public boolean isConnectionActive(String connectionId) {
        P2PConnectionInfo info = connections.get(connectionId);
        if (info == null) {
            return false;
        }

        String processId1 = connectionId + "-" + info.userId1;
        String processId2 = connectionId + "-" + info.userId2;

        boolean user1Running = n2nProcessManager.isProcessRunning(processId1);
        boolean user2Running = n2nProcessManager.isProcessRunning(processId2);

        return user1Running && user2Running;
    }

    /**
     * 生成连接ID
     */
    private String generateConnectionId() {
        return "p2p-" + UUID.randomUUID().toString();
    }

    /**
     * 生成社区名称
     */
    private String generateCommunity(Long userId1, Long userId2) {
        // 使用较小的用户ID在前，确保双方社区名称一致
        long minId = Math.min(userId1, userId2);
        long maxId = Math.max(userId1, userId2);
        return n2nProperties.getCommunityPrefix() + "-" + minId + "-" + maxId;
    }

    /**
     * 生成加密密码
     */
    private String generatePassword() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * 分配虚拟IP地址
     */
    private String allocateVirtualIp() {
        int ipSuffix = ipAllocator.getAndIncrement();
        
        if (ipSuffix > IP_END) {
            // IP地址池已满，重置到起始位置（实际应用中需要更复杂的IP管理）
            ipAllocator.set(IP_START);
            ipSuffix = ipAllocator.getAndIncrement();
        }

        return DEFAULT_IP_PREFIX + ipSuffix;
    }

    /**
     * 释放虚拟IP地址
     */
    private void releaseVirtualIp(String ip) {
        // 简化实现，实际应用中需要维护IP地址池
        log.debug("释放虚拟IP: {}", ip);
    }

    /**
     * P2P连接信息
     */
    public static class P2PConnectionInfo {
        public final String connectionId;
        public final String community;
        public final Long userId1;
        public final Long userId2;
        public final String virtualIp1;
        public final String virtualIp2;
        public boolean user1Connected;
        public boolean user2Connected;

        public P2PConnectionInfo(String connectionId, String community, 
                                Long userId1, Long userId2, 
                                String virtualIp1, String virtualIp2) {
            this.connectionId = connectionId;
            this.community = community;
            this.userId1 = userId1;
            this.userId2 = userId2;
            this.virtualIp1 = virtualIp1;
            this.virtualIp2 = virtualIp2;
            this.user1Connected = false;
            this.user2Connected = false;
        }
    }
}
