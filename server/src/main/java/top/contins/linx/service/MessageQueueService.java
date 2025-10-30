package top.contins.linx.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.common.ChatMessage;
import top.contins.linx.model.entity.ChatMessageEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * 消息队列服务
 * 提供批量异步消息写入功能，优化数据库压力
 */
@Slf4j
@Service
public class MessageQueueService {

    private static final int BATCH_SIZE = 100;
    
    private final ChatMessageService chatMessageService;

    @Autowired
    public MessageQueueService(ChatMessageService chatMessageService) {
        this.chatMessageService = chatMessageService;
    }

    /**
     * 异步批量保存消息
     * 
     * @param messages 消息列表
     * @return CompletableFuture，包含保存的消息实体列表
     */
    @Async
    @Transactional
    public CompletableFuture<List<ChatMessageEntity>> saveBatchAsync(List<ChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return CompletableFuture.completedFuture(List.of());
        }

        try {
            log.info("开始异步批量保存消息: count={}", messages.size());
            
            List<ChatMessageEntity> savedEntities = new ArrayList<>();
            
            // 分批处理
            for (int i = 0; i < messages.size(); i += BATCH_SIZE) {
                int end = Math.min(i + BATCH_SIZE, messages.size());
                List<ChatMessage> batch = messages.subList(i, end);
                
                List<ChatMessageEntity> batchSaved = chatMessageService.saveMessages(batch);
                savedEntities.addAll(batchSaved);
                
                log.debug("批量保存消息完成: batch={}/{}, count={}", 
                    (i / BATCH_SIZE) + 1, 
                    (messages.size() + BATCH_SIZE - 1) / BATCH_SIZE, 
                    batchSaved.size());
            }
            
            log.info("异步批量保存消息完成: total={}", savedEntities.size());
            return CompletableFuture.completedFuture(savedEntities);
            
        } catch (Exception e) {
            log.error("异步批量保存消息失败", e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * 异步保存单条消息
     * 
     * @param message 消息对象
     * @return CompletableFuture，包含保存的消息实体
     */
    @Async
    @Transactional
    public CompletableFuture<ChatMessageEntity> saveAsync(ChatMessage message) {
        if (message == null) {
            return CompletableFuture.completedFuture(null);
        }

        try {
            ChatMessageEntity saved = chatMessageService.saveMessage(message);
            return CompletableFuture.completedFuture(saved);
            
        } catch (Exception e) {
            log.error("异步保存消息失败: messageId={}", message.getMessageId(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * 批量保存消息（同步版本，用于需要立即确认的场景）
     * 
     * @param messages 消息列表
     * @return 保存的消息实体列表
     */
    @Transactional
    public List<ChatMessageEntity> saveBatchSync(List<ChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return List.of();
        }

        try {
            log.info("开始同步批量保存消息: count={}", messages.size());
            
            List<ChatMessageEntity> savedEntities = new ArrayList<>();
            
            // 分批处理以避免单次事务过大
            for (int i = 0; i < messages.size(); i += BATCH_SIZE) {
                int end = Math.min(i + BATCH_SIZE, messages.size());
                List<ChatMessage> batch = messages.subList(i, end);
                
                List<ChatMessageEntity> batchSaved = chatMessageService.saveMessages(batch);
                savedEntities.addAll(batchSaved);
            }
            
            log.info("同步批量保存消息完成: total={}", savedEntities.size());
            return savedEntities;
            
        } catch (Exception e) {
            log.error("同步批量保存消息失败", e);
            throw e;
        }
    }
}
