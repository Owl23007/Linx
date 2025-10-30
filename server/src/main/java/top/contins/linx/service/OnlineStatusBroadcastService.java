package top.contins.linx.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.HashMap;
import java.util.Map;

/**
 * 在线状态广播服务
 * 使用 Redis Pub/Sub 在集群节点间同步用户在线状态
 */
@Slf4j
@Service
public class OnlineStatusBroadcastService implements MessageListener {

    private static final String ONLINE_STATUS_CHANNEL = "linx:online:status";
    private static final String STATUS_ONLINE = "ONLINE";
    private static final String STATUS_OFFLINE = "OFFLINE";

    private final StringRedisTemplate stringRedisTemplate;
    private final RedisMessageListenerContainer redisMessageListenerContainer;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public OnlineStatusBroadcastService(
            StringRedisTemplate stringRedisTemplate,
            RedisMessageListenerContainer redisMessageListenerContainer,
            SimpMessagingTemplate messagingTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.redisMessageListenerContainer = redisMessageListenerContainer;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 初始化订阅
     */
    @PostConstruct
    public void init() {
        try {
            redisMessageListenerContainer.addMessageListener(
                this, 
                new ChannelTopic(ONLINE_STATUS_CHANNEL)
            );
            log.info("在线状态广播服务已启动，订阅频道: {}", ONLINE_STATUS_CHANNEL);
        } catch (Exception e) {
            log.error("初始化在线状态广播服务失败", e);
        }
    }

    /**
     * 广播用户上线状态
     * 
     * @param userId 用户ID
     * @param username 用户名
     */
    public void broadcastUserOnline(Long userId, String username) {
        if (userId == null) {
            return;
        }

        try {
            Map<String, Object> statusMessage = new HashMap<>();
            statusMessage.put("userId", userId);
            statusMessage.put("username", username);
            statusMessage.put("status", STATUS_ONLINE);
            statusMessage.put("timestamp", System.currentTimeMillis());

            String message = objectMapper.writeValueAsString(statusMessage);
            stringRedisTemplate.convertAndSend(ONLINE_STATUS_CHANNEL, message);

            log.info("广播用户上线状态: userId={}, username={}", userId, username);

        } catch (Exception e) {
            log.error("广播用户上线状态失败: userId={}", userId, e);
        }
    }

    /**
     * 广播用户下线状态
     * 
     * @param userId 用户ID
     * @param username 用户名
     */
    public void broadcastUserOffline(Long userId, String username) {
        if (userId == null) {
            return;
        }

        try {
            Map<String, Object> statusMessage = new HashMap<>();
            statusMessage.put("userId", userId);
            statusMessage.put("username", username);
            statusMessage.put("status", STATUS_OFFLINE);
            statusMessage.put("timestamp", System.currentTimeMillis());

            String message = objectMapper.writeValueAsString(statusMessage);
            stringRedisTemplate.convertAndSend(ONLINE_STATUS_CHANNEL, message);

            log.info("广播用户下线状态: userId={}, username={}", userId, username);

        } catch (Exception e) {
            log.error("广播用户下线状态失败: userId={}", userId, e);
        }
    }

    /**
     * 接收在线状态消息并转发给WebSocket客户端
     */
    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String messageBody = new String(message.getBody());
            
            @SuppressWarnings("unchecked")
            Map<String, Object> statusMessage = objectMapper.readValue(messageBody, Map.class);
            
            // 通过WebSocket广播给所有订阅的客户端
            messagingTemplate.convertAndSend("/topic/status", statusMessage);
            
            log.debug("转发在线状态消息: {}", statusMessage);

        } catch (Exception e) {
            log.error("处理在线状态消息失败", e);
        }
    }

    /**
     * 服务关闭前清理
     */
    @PreDestroy
    public void cleanup() {
        try {
            redisMessageListenerContainer.removeMessageListener(this);
            log.info("在线状态广播服务已停止");
        } catch (Exception e) {
            log.error("清理在线状态广播服务失败", e);
        }
    }
}
