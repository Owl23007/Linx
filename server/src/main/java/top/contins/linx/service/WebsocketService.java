package top.contins.linx.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import top.contins.linx.model.dto.ChatMessage;
import top.contins.linx.model.dto.UserSession;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * WebSocket 统一服务
 * 整合会话管理、消息发送、凭证管理等功能
 */
@Slf4j
@Service
public class WebsocketService {

    private static final String TICKET_PREFIX = "ws:ticket:";
    private static final String ONLINE_USER_PREFIX = "ws:online:";
    private static final String USER_SESSION_PREFIX = "ws:session:";
    private static final long SESSION_TIMEOUT = 30; // 会话超时时间（分钟）

    private final StringRedisTemplate stringRedisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public WebsocketService(
            StringRedisTemplate stringRedisTemplate,
            SimpMessagingTemplate messagingTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    // ================================
    // 会话管理相关方法
    // ================================

    /**
     * 用户上线
     *
     * @param userId 用户ID
     * @param sessionId WebSocket 会话ID
     */
    public void userOnline(Long userId, String sessionId) {
        if (userId == null || sessionId == null) {
            return;
        }

        try {
            String userKey = ONLINE_USER_PREFIX + userId;
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

            // 存储用户在线状态
            stringRedisTemplate.opsForValue().set(
                    userKey,
                    sessionId + ":" + timestamp,
                    SESSION_TIMEOUT,
                    TimeUnit.MINUTES
            );

            // 存储会话到用户的映射
            String sessionKey = USER_SESSION_PREFIX + sessionId;
            stringRedisTemplate.opsForValue().set(
                    sessionKey,
                    String.valueOf(userId),
                    SESSION_TIMEOUT,
                    TimeUnit.MINUTES
            );

            log.info("用户 {} 上线，会话ID: {}", userId, sessionId);

        } catch (Exception e) {
            log.error("标记用户上线失败：userId={}, sessionId={}", userId, sessionId, e);
        }
    }

    /**
     * 用户下线
     *
     * @param userId 用户ID
     * @param sessionId WebSocket 会话ID
     */
    public void userOffline(Long userId, String sessionId) {
        if (userId == null || sessionId == null) {
            return;
        }

        try {
            String userKey = ONLINE_USER_PREFIX + userId;
            String sessionKey = USER_SESSION_PREFIX + sessionId;

            // 删除在线状态
            stringRedisTemplate.delete(userKey);
            stringRedisTemplate.delete(sessionKey);

            log.info("用户 {} 下线，会话ID: {}", userId, sessionId);

        } catch (Exception e) {
            log.error("标记用户下线失败：userId={}, sessionId={}", userId, sessionId, e);
        }
    }

    /**
     * 刷新用户会话（心跳）
     *
     * @param userId 用户ID
     */
    public void refreshSession(Long userId) {
        if (userId == null) {
            return;
        }

        try {
            String userKey = ONLINE_USER_PREFIX + userId;

            // 延长过期时间
            stringRedisTemplate.expire(userKey, SESSION_TIMEOUT, TimeUnit.MINUTES);

            log.debug("刷新用户 {} 的会话", userId);

        } catch (Exception e) {
            log.error("刷新用户会话失败：userId={}", userId, e);
        }
    }

    /**
     * 检查用户是否在线
     *
     * @param userId 用户ID
     * @return true-在线，false-离线
     */
    public boolean isUserOnline(Long userId) {
        if (userId == null) {
            return false;
        }

        try {
            String userKey = ONLINE_USER_PREFIX + userId;
            return Boolean.TRUE.equals(stringRedisTemplate.hasKey(userKey));

        } catch (Exception e) {
            log.error("检查用户在线状态失败：userId={}", userId, e);
            return false;
        }
    }

    /**
     * 获取用户的会话ID
     *
     * @param userId 用户ID
     * @return 会话ID，如果用户不在线则返回 null
     */
    public String getUserSessionId(Long userId) {
        if (userId == null) {
            return null;
        }

        try {
            String userKey = ONLINE_USER_PREFIX + userId;
            String value = stringRedisTemplate.opsForValue().get(userKey);

            if (value != null && value.contains(":")) {
                // 格式：sessionId:timestamp
                return value.split(":")[0];
            }

            return null;

        } catch (Exception e) {
            log.error("获取用户会话ID失败：userId={}", userId, e);
            return null;
        }
    }

    /**
     * 根据会话ID获取用户ID
     *
     * @param sessionId WebSocket 会话ID
     * @return 用户ID，如果会话不存在则返回 null
     */
    public Long getUserIdBySessionId(String sessionId) {
        if (sessionId == null) {
            return null;
        }

        try {
            String sessionKey = USER_SESSION_PREFIX + sessionId;
            String userId = stringRedisTemplate.opsForValue().get(sessionKey);

            if (userId != null) {
                return Long.parseLong(userId);
            }

            return null;

        } catch (Exception e) {
            log.error("根据会话ID获取用户ID失败：sessionId={}", sessionId, e);
            return null;
        }
    }

    /**
     * 获取所有在线用户ID
     *
     * @return 在线用户ID集合
     */
    public Set<String> getOnlineUserIds() {
        try {
            Set<String> keys = stringRedisTemplate.keys(ONLINE_USER_PREFIX + "*");

            if (keys != null) {
                // 移除前缀，只保留用户ID
                keys.forEach(key -> key.replace(ONLINE_USER_PREFIX, ""));
                return keys;
            }

            return Set.of();

        } catch (Exception e) {
            log.error("获取在线用户列表失败", e);
            return Set.of();
        }
    }

    /**
     * 获取在线用户数量
     *
     * @return 在线用户数
     */
    public long getOnlineUserCount() {
        try {
            Set<String> keys = stringRedisTemplate.keys(ONLINE_USER_PREFIX + "*");
            return keys != null ? keys.size() : 0;

        } catch (Exception e) {
            log.error("获取在线用户数量失败", e);
            return 0;
        }
    }

    // ================================
    // 凭证管理相关方法
    // ================================

    /**
     * 创建 WebSocket 连接凭证（5分钟有效期）
     *
     * @return 临时 ticket
     */
    public String createTicket(Long userId, String jti) {

        if (userId == null || jti == null) {
            throw new SecurityException("Invalid userId or jti");
        }

        // 2. 拼接存储值：userId:jti
        String value = userId + ":" + jti;

        // 3. 存入 Redis
        String ticket = UUID.randomUUID().toString();
        stringRedisTemplate.opsForValue().set(
                TICKET_PREFIX + ticket,
                value,
                5,
                TimeUnit.MINUTES
        );
        return ticket;
    }

    /**
     * 验证并消费 ticket，返回重建的 UserSession
     *
     * @param ticket 临时凭证
     * @return UserSession 对象，无效则返回 null
     */
    public UserSession consumeTicket(String ticket) {
        if (ticket == null || ticket.trim().isEmpty()) {
            return null;
        }

        String key = TICKET_PREFIX + ticket;
        String value = stringRedisTemplate.opsForValue().get(key);
        if (value == null) {
            return null;
        }

        // 删除 ticket（一次性使用）
        stringRedisTemplate.delete(key);

        // 解析 userId 和 jti
        String[] parts = value.split(":", 2);
        if (parts.length != 2) {
            throw new SecurityException("Invalid ticket format");
        }

        Long userId = Long.parseLong(parts[0]);
        String jti = parts[1];

        // 重建 UserSession
        return new UserSession(userId, jti);
    }

    // ================================
    // 消息发送相关方法
    // ================================

    /**
     * 发送私聊消息给指定用户
     *
     * @param userId 接收者用户ID
     * @param message 消息内容
     */
    public void sendToUser(Long userId, ChatMessage message) {
        try {
            if (userId == null) {
                log.warn("发送消息失败：用户ID为空");
                return;
            }

            // 检查用户是否在线
            if (!isUserOnline(userId)) {
                log.debug("用户 {} 不在线，消息将被存储待推送", userId);
                // 这里可以将消息存储到数据库，等用户上线后推送
                return;
            }

            // 发送消息到用户的私有队列
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(userId),
                    "/queue/messages",
                    message
            );

            log.debug("已向用户 {} 发送消息", userId);

        } catch (Exception e) {
            log.error("发送私聊消息失败：userId={}", userId, e);
        }
    }

    /**
     * 广播消息到指定主题（群聊）
     *
     * @param topic 主题
     * @param message 消息内容
     */
    public void broadcastToTopic(String topic, ChatMessage message) {
        try {
            if (topic == null || topic.trim().isEmpty()) {
                log.warn("广播消息失败：主题为空");
                return;
            }

            messagingTemplate.convertAndSend(topic, message);
            log.debug("已广播消息到主题: {}", topic);

        } catch (Exception e) {
            log.error("广播消息失败：topic={}", topic, e);
        }
    }

    /**
     * 发送系统通知给所有在线用户
     *
     * @param message 系统消息
     */
    public void broadcastSystemMessage(ChatMessage message) {
        broadcastToTopic("/topic/system", message);
    }

    /**
     * 发送系统通知给指定用户
     *
     * @param userId 用户ID
     * @param message 系统消息
     */
    public void sendSystemMessageToUser(Long userId, ChatMessage message) {
        try {
            if (userId == null) {
                return;
            }

            messagingTemplate.convertAndSendToUser(
                    String.valueOf(userId),
                    "/queue/system",
                    message
            );

            log.debug("已向用户 {} 发送系统消息", userId);

        } catch (Exception e) {
            log.error("发送系统消息失败：userId={}", userId, e);
        }
    }
}
