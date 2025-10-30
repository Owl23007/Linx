package top.contins.linx.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.stream.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import top.contins.linx.model.common.ChatMessage;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 离线消息服务
 * 使用 Redis Stream 管理离线消息队列
 */
@Slf4j
@Service
public class OfflineMessageService {

    private static final String OFFLINE_MESSAGE_STREAM_PREFIX = "offline:messages:";
    private static final String CONSUMER_GROUP = "linx-server";
    
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public OfflineMessageService(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.findAndRegisterModules();
    }

    /**
     * 将消息存入离线队列
     * 
     * @param userId 接收者用户ID
     * @param message 消息对象
     */
    public void storeOfflineMessage(Long userId, ChatMessage message) {
        if (userId == null || message == null) {
            log.warn("存储离线消息失败：参数为空");
            return;
        }

        try {
            String streamKey = OFFLINE_MESSAGE_STREAM_PREFIX + userId;
            
            // 序列化消息为JSON
            String messageJson = objectMapper.writeValueAsString(message);
            
            // 存入Redis Stream
            Map<String, String> messageMap = Map.of(
                "messageId", message.getMessageId() != null ? message.getMessageId() : "",
                "content", messageJson
            );
            
            RecordId recordId = stringRedisTemplate.opsForStream()
                .add(StreamRecords.newRecord()
                    .ofStrings(messageMap)
                    .withStreamKey(streamKey));
            
            log.info("离线消息已存储: userId={}, messageId={}, recordId={}", 
                userId, message.getMessageId(), recordId);
            
            // 确保消费组存在
            ensureConsumerGroupExists(streamKey);
            
        } catch (Exception e) {
            log.error("存储离线消息失败: userId={}, messageId={}", 
                userId, message.getMessageId(), e);
        }
    }

    /**
     * 批量存储离线消息
     * 
     * @param userId 接收者用户ID
     * @param messages 消息列表
     */
    public void storeOfflineMessages(Long userId, List<ChatMessage> messages) {
        if (userId == null || messages == null || messages.isEmpty()) {
            return;
        }

        for (ChatMessage message : messages) {
            storeOfflineMessage(userId, message);
        }
    }

    /**
     * 获取用户的离线消息
     * 
     * @param userId 用户ID
     * @param count 获取数量（最多）
     * @return 离线消息列表
     */
    public List<ChatMessage> getOfflineMessages(Long userId, long count) {
        List<ChatMessage> messages = new ArrayList<>();
        
        if (userId == null || count <= 0) {
            return messages;
        }

        try {
            String streamKey = OFFLINE_MESSAGE_STREAM_PREFIX + userId;
            
            // 确保消费组存在
            ensureConsumerGroupExists(streamKey);
            
            // 从Stream中读取消息
            List<MapRecord<String, Object, Object>> records = stringRedisTemplate.opsForStream()
                .read(Consumer.from(CONSUMER_GROUP, "consumer-" + userId),
                    StreamReadOptions.empty().count((int) count),
                    StreamOffset.create(streamKey, ReadOffset.lastConsumed()));
            
            if (records != null) {
                for (MapRecord<String, Object, Object> record : records) {
                    try {
                        Object contentObj = record.getValue().get("content");
                        if (contentObj != null) {
                            String messageJson = contentObj.toString();
                            ChatMessage message = objectMapper.readValue(messageJson, ChatMessage.class);
                            messages.add(message);
                            
                            // 确认消息已处理
                            stringRedisTemplate.opsForStream()
                                .acknowledge(streamKey, CONSUMER_GROUP, record.getId());
                        }
                    } catch (Exception e) {
                        log.error("解析离线消息失败: recordId={}", record.getId(), e);
                    }
                }
            }
            
            log.info("获取离线消息: userId={}, count={}", userId, messages.size());
            
        } catch (Exception e) {
            log.error("获取离线消息失败: userId={}", userId, e);
        }
        
        return messages;
    }

    /**
     * 清空用户的离线消息队列
     * 
     * @param userId 用户ID
     */
    public void clearOfflineMessages(Long userId) {
        if (userId == null) {
            return;
        }

        try {
            String streamKey = OFFLINE_MESSAGE_STREAM_PREFIX + userId;
            stringRedisTemplate.delete(streamKey);
            
            log.info("离线消息队列已清空: userId={}", userId);
            
        } catch (Exception e) {
            log.error("清空离线消息队列失败: userId={}", userId, e);
        }
    }

    /**
     * 获取离线消息数量
     * 
     * @param userId 用户ID
     * @return 离线消息数量
     */
    public long getOfflineMessageCount(Long userId) {
        if (userId == null) {
            return 0;
        }

        try {
            String streamKey = OFFLINE_MESSAGE_STREAM_PREFIX + userId;
            Long size = stringRedisTemplate.opsForStream().size(streamKey);
            return size != null ? size : 0;
            
        } catch (Exception e) {
            log.error("获取离线消息数量失败: userId={}", userId, e);
            return 0;
        }
    }

    /**
     * 确保消费组存在
     * 
     * @param streamKey Stream键
     */
    private void ensureConsumerGroupExists(String streamKey) {
        try {
            // 尝试创建消费组（如果已存在会抛出异常，忽略即可）
            stringRedisTemplate.opsForStream()
                .createGroup(streamKey, ReadOffset.from("0"), CONSUMER_GROUP);
        } catch (Exception e) {
            // 消费组已存在或其他错误，记录调试日志
            log.debug("消费组可能已存在或创建失败: streamKey={}", streamKey);
        }
    }
}
