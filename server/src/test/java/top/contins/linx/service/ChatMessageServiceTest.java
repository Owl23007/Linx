package top.contins.linx.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import top.contins.linx.model.common.ChatMessage;
import top.contins.linx.model.entity.ChatMessageEntity;
import top.contins.linx.model.enums.MessageStatus;
import top.contins.linx.model.enums.MessageType;
import top.contins.linx.repository.ChatMessageRepository;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * ChatMessageService单元测试
 */
@ExtendWith(MockitoExtension.class)
class ChatMessageServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @InjectMocks
    private ChatMessageService chatMessageService;

    private ChatMessage testMessage;
    private ChatMessageEntity testEntity;

    @BeforeEach
    void setUp() {
        testMessage = new ChatMessage();
        testMessage.setMessageId("test-message-id");
        testMessage.setType(MessageType.CHAT);
        testMessage.setSenderId(1L);
        testMessage.setSenderName("TestUser");
        testMessage.setReceiverId(2L);
        testMessage.setContent("Test message content");
        testMessage.setTimestamp(LocalDateTime.now());
        testMessage.setIsRead(false);

        testEntity = ChatMessageEntity.builder()
                .id(1L)
                .messageId("test-message-id")
                .type(MessageType.CHAT)
                .senderId(1L)
                .senderName("TestUser")
                .receiverId(2L)
                .content("Test message content")
                .timestamp(LocalDateTime.now())
                .isRead(false)
                .status(MessageStatus.NORMAL)
                .build();
    }

    @Test
    void testSaveMessage() {
        when(chatMessageRepository.save(any(ChatMessageEntity.class)))
                .thenReturn(testEntity);

        ChatMessageEntity result = chatMessageService.saveMessage(testMessage);

        assertNotNull(result);
        assertEquals(testMessage.getMessageId(), result.getMessageId());
        assertEquals(testMessage.getContent(), result.getContent());
        verify(chatMessageRepository, times(1)).save(any(ChatMessageEntity.class));
    }

    @Test
    void testRevokeMessage_Success() {
        when(chatMessageRepository.findByMessageId("test-message-id"))
                .thenReturn(Optional.of(testEntity));
        when(chatMessageRepository.save(any(ChatMessageEntity.class)))
                .thenReturn(testEntity);

        boolean result = chatMessageService.revokeMessage("test-message-id", 1L);

        assertTrue(result);
        verify(chatMessageRepository, times(1)).findByMessageId("test-message-id");
        verify(chatMessageRepository, times(1)).save(any(ChatMessageEntity.class));
    }

    @Test
    void testRevokeMessage_NotSender() {
        when(chatMessageRepository.findByMessageId("test-message-id"))
                .thenReturn(Optional.of(testEntity));

        // Try to revoke with wrong user ID
        boolean result = chatMessageService.revokeMessage("test-message-id", 999L);

        assertFalse(result);
        verify(chatMessageRepository, times(1)).findByMessageId("test-message-id");
        verify(chatMessageRepository, never()).save(any(ChatMessageEntity.class));
    }

    @Test
    void testRevokeMessage_NotFound() {
        when(chatMessageRepository.findByMessageId("non-existent-id"))
                .thenReturn(Optional.empty());

        boolean result = chatMessageService.revokeMessage("non-existent-id", 1L);

        assertFalse(result);
        verify(chatMessageRepository, times(1)).findByMessageId("non-existent-id");
        verify(chatMessageRepository, never()).save(any(ChatMessageEntity.class));
    }

    @Test
    void testSaveQuotedMessage() {
        ChatMessageEntity quotedEntity = ChatMessageEntity.builder()
                .messageId("quoted-message-id")
                .content("Original message")
                .build();

        when(chatMessageRepository.findByMessageId("quoted-message-id"))
                .thenReturn(Optional.of(quotedEntity));
        when(chatMessageRepository.save(any(ChatMessageEntity.class)))
                .thenReturn(testEntity);

        ChatMessageEntity result = chatMessageService.saveQuotedMessage(
                testMessage, "quoted-message-id", 3);

        assertNotNull(result);
        verify(chatMessageRepository, times(1)).save(any(ChatMessageEntity.class));
    }

    @Test
    void testEntityToMessage() {
        ChatMessage result = chatMessageService.entityToMessage(testEntity);

        assertNotNull(result);
        assertEquals(testEntity.getMessageId(), result.getMessageId());
        assertEquals(testEntity.getContent(), result.getContent());
        assertEquals(testEntity.getSenderId(), result.getSenderId());
    }
}
