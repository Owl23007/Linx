package top.contins.linx.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import top.contins.linx.exception.P2PConnectionException;
import top.contins.linx.model.dto.P2PConnectionDto;
import top.contins.linx.service.P2PVpnService.P2PConnectionInfo;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 信令服务
 * 负责P2P连接的信令协调和状态管理
 */
@Slf4j
@Service
public class SignalingService {

    // 存储连接请求和密码 (connectionId -> password)
    private final Map<String, String> connectionPasswords = new ConcurrentHashMap<>();
    
    private final P2PVpnService p2pVpnService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public SignalingService(P2PVpnService p2pVpnService, 
                           SimpMessagingTemplate messagingTemplate) {
        this.p2pVpnService = p2pVpnService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * 发起P2P连接请求
     * 
     * @param fromUserId 发起者用户ID
     * @param toUserId 目标用户ID
     * @return P2P连接信息
     */
    public P2PConnectionDto initiateConnection(Long fromUserId, Long toUserId) {
        if (fromUserId == null || toUserId == null) {
            throw new IllegalArgumentException("用户ID不能为空");
        }

        try {
            // 创建P2P连接
            P2PConnectionInfo connectionInfo = p2pVpnService.createConnection(fromUserId, toUserId);
            
            // 生成并存储密码
            String password = generateSecurePassword();
            connectionPasswords.put(connectionInfo.connectionId, password);

            // 构建DTO
            P2PConnectionDto dto = new P2PConnectionDto();
            dto.setConnectionId(connectionInfo.connectionId);
            dto.setCommunity(connectionInfo.community);
            dto.setUserId1(connectionInfo.userId1);
            dto.setUserId2(connectionInfo.userId2);
            dto.setVirtualIp1(connectionInfo.virtualIp1);
            dto.setVirtualIp2(connectionInfo.virtualIp2);
            dto.setPassword(password);
            dto.setStatus("INITIATED");

            // 通过WebSocket通知目标用户
            notifyUser(toUserId, "p2p-request", dto);

            log.info("P2P连接请求已发起: fromUserId={}, toUserId={}, connectionId={}", 
                fromUserId, toUserId, connectionInfo.connectionId);

            return dto;

        } catch (Exception e) {
            log.error("发起P2P连接请求失败: fromUserId={}, toUserId={}", fromUserId, toUserId, e);
            throw new P2PConnectionException("发起P2P连接请求失败", e);
        }
    }

    /**
     * 接受P2P连接请求
     * 
     * @param connectionId 连接ID
     * @param userId 接受者用户ID
     * @return 连接详情
     */
    public P2PConnectionDto acceptConnection(String connectionId, Long userId) {
        if (connectionId == null || userId == null) {
            throw new IllegalArgumentException("参数不能为空");
        }

        try {
            String password = connectionPasswords.get(connectionId);
            if (password == null) {
                throw new P2PConnectionException("连接不存在或已过期");
            }

            P2PConnectionInfo connectionInfo = p2pVpnService.getConnectionInfo(connectionId);
            if (connectionInfo == null) {
                throw new P2PConnectionException("连接信息不存在");
            }

            // 启动用户的P2P连接
            boolean started = p2pVpnService.startConnection(connectionId, userId, password);
            
            if (!started) {
                throw new P2PConnectionException("启动P2P连接失败");
            }

            // 构建响应DTO
            P2PConnectionDto dto = new P2PConnectionDto();
            dto.setConnectionId(connectionInfo.connectionId);
            dto.setCommunity(connectionInfo.community);
            dto.setUserId1(connectionInfo.userId1);
            dto.setUserId2(connectionInfo.userId2);
            dto.setVirtualIp1(connectionInfo.virtualIp1);
            dto.setVirtualIp2(connectionInfo.virtualIp2);
            dto.setPassword(password);
            dto.setStatus("ACCEPTED");

            // 通知发起者
            Long otherUserId = userId.equals(connectionInfo.userId1) 
                ? connectionInfo.userId2 : connectionInfo.userId1;
            notifyUser(otherUserId, "p2p-accepted", dto);

            log.info("P2P连接请求已接受: connectionId={}, userId={}", connectionId, userId);

            return dto;

        } catch (Exception e) {
            log.error("接受P2P连接请求失败: connectionId={}, userId={}", connectionId, userId, e);
            throw new P2PConnectionException("接受P2P连接请求失败", e);
        }
    }

    /**
     * 拒绝P2P连接请求
     * 
     * @param connectionId 连接ID
     * @param userId 拒绝者用户ID
     */
    public void rejectConnection(String connectionId, Long userId) {
        if (connectionId == null || userId == null) {
            return;
        }

        try {
            connectionPasswords.remove(connectionId);
            
            P2PConnectionInfo connectionInfo = p2pVpnService.getConnectionInfo(connectionId);
            if (connectionInfo != null) {
                p2pVpnService.stopConnection(connectionId);
                
                // 通知发起者
                Long otherUserId = userId.equals(connectionInfo.userId1) 
                    ? connectionInfo.userId2 : connectionInfo.userId1;
                
                Map<String, Object> message = Map.of(
                    "connectionId", connectionId,
                    "status", "REJECTED"
                );
                notifyUser(otherUserId, "p2p-rejected", message);
            }

            log.info("P2P连接请求已拒绝: connectionId={}, userId={}", connectionId, userId);

        } catch (Exception e) {
            log.error("拒绝P2P连接请求失败: connectionId={}, userId={}", connectionId, userId, e);
        }
    }

    /**
     * 断开P2P连接
     * 
     * @param connectionId 连接ID
     * @param userId 操作用户ID
     */
    public void disconnectConnection(String connectionId, Long userId) {
        if (connectionId == null) {
            return;
        }

        try {
            connectionPasswords.remove(connectionId);
            
            P2PConnectionInfo connectionInfo = p2pVpnService.getConnectionInfo(connectionId);
            if (connectionInfo != null) {
                p2pVpnService.stopConnection(connectionId);
                
                // 通知另一个用户
                if (userId != null) {
                    Long otherUserId = userId.equals(connectionInfo.userId1) 
                        ? connectionInfo.userId2 : connectionInfo.userId1;
                    
                    Map<String, Object> message = Map.of(
                        "connectionId", connectionId,
                        "status", "DISCONNECTED"
                    );
                    notifyUser(otherUserId, "p2p-disconnected", message);
                }
            }

            log.info("P2P连接已断开: connectionId={}, userId={}", connectionId, userId);

        } catch (Exception e) {
            log.error("断开P2P连接失败: connectionId={}, userId={}", connectionId, userId, e);
        }
    }

    /**
     * 获取连接密码
     * 
     * @param connectionId 连接ID
     * @return 密码
     */
    public String getConnectionPassword(String connectionId) {
        return connectionPasswords.get(connectionId);
    }

    /**
     * 通过WebSocket通知用户
     */
    private void notifyUser(Long userId, String eventType, Object payload) {
        if (userId == null) {
            return;
        }

        try {
            messagingTemplate.convertAndSendToUser(
                String.valueOf(userId),
                "/queue/p2p",
                Map.of(
                    "eventType", eventType,
                    "payload", payload,
                    "timestamp", System.currentTimeMillis()
                )
            );
        } catch (Exception e) {
            log.error("通知用户失败: userId={}, eventType={}", userId, eventType, e);
        }
    }

    /**
     * 生成安全密码
     */
    private String generateSecurePassword() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
