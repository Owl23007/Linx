package top.contins.linx.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import top.contins.linx.model.dto.SendMessageDTO;
import top.contins.linx.model.vo.MessageVO;
import top.contins.linx.service.MessageService;

import java.security.Principal;

/**
 * WebSocket聊天控制器
 */
@Controller
public class ChatWebSocketController {
    
    @Autowired
    private MessageService messageService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    /**
     * 发送私聊消息
     */
    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload SendMessageDTO messageDTO, Principal principal) {
        try {
            // 这里需要从principal中获取用户ID，实际项目中应该有JWT解析等
            // 暂时使用简单的模拟方式
            Long senderId = getUserIdFromPrincipal(principal);
            
            MessageVO message = messageService.sendPrivateMessage(
                    senderId,
                    messageDTO.getReceiverId(),
                    messageDTO.getContent(),
                    messageDTO.getType(),
                    messageDTO.getReplyToId(),
                    messageDTO.getExtraData()
            );
            
            // 发送给接收者
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(messageDTO.getReceiverId()),
                    "/queue/messages",
                    message
            );
            
            // 发送给发送者确认
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(senderId),
                    "/queue/messages",
                    message
            );
            
        } catch (Exception e) {
            // 发送错误消息给发送者
            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    "发送消息失败: " + e.getMessage()
            );
        }
    }
    
    /**
     * 发送群聊消息
     */
    @MessageMapping("/chat.group")
    @SendTo("/topic/group/{groupId}")
    public MessageVO sendGroupMessage(@Payload SendMessageDTO messageDTO, Principal principal) {
        try {
            Long senderId = getUserIdFromPrincipal(principal);
            
            MessageVO message = messageService.sendGroupMessage(
                    senderId,
                    messageDTO.getGroupId(),
                    messageDTO.getContent(),
                    messageDTO.getType(),
                    messageDTO.getReplyToId(),
                    messageDTO.getExtraData()
            );
            
            return message;
            
        } catch (Exception e) {
            // 发送错误消息给发送者
            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    "发送群聊消息失败: " + e.getMessage()
            );
            return null;
        }
    }
    
    /**
     * 用户上线通知
     */
    @MessageMapping("/user.online")
    @SendTo("/topic/user.status")
    public String userOnline(Principal principal) {
        // 这里可以更新用户状态为在线
        return principal.getName() + " 已上线";
    }
    
    /**
     * 用户下线通知
     */
    @MessageMapping("/user.offline")
    @SendTo("/topic/user.status")
    public String userOffline(Principal principal) {
        // 这里可以更新用户状态为离线
        return principal.getName() + " 已下线";
    }
    
    /**
     * 输入状态通知（正在输入）
     */
    @MessageMapping("/chat.typing")
    public void userTyping(@Payload TypingNotification notification, Principal principal) {
        Long senderId = getUserIdFromPrincipal(principal);
        
        if (notification.getChatType().equals("PRIVATE")) {
            // 发送给私聊对象
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(notification.getTargetId()),
                    "/queue/typing",
                    new TypingNotification(senderId, notification.getChatType(), 
                                         notification.getTargetId(), notification.isTyping())
            );
        } else if (notification.getChatType().equals("GROUP")) {
            // 发送给群组所有成员
            messagingTemplate.convertAndSend(
                    "/topic/group/" + notification.getTargetId() + "/typing",
                    new TypingNotification(senderId, notification.getChatType(), 
                                         notification.getTargetId(), notification.isTyping())
            );
        }
    }
    
    /**
     * 从Principal中提取用户ID
     * 实际项目中应该从JWT token中解析
     */
    private Long getUserIdFromPrincipal(Principal principal) {
        // 这里是简化实现，实际应该从JWT token中解析用户ID
        try {
            return Long.parseLong(principal.getName());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("无效的用户标识");
        }
    }
    
    /**
     * 输入状态通知类
     */
    public static class TypingNotification {
        private Long userId;
        private String chatType;
        private Long targetId;
        private boolean typing;
        
        public TypingNotification() {}
        
        public TypingNotification(Long userId, String chatType, Long targetId, boolean typing) {
            this.userId = userId;
            this.chatType = chatType;
            this.targetId = targetId;
            this.typing = typing;
        }
        
        // Getters and Setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public String getChatType() { return chatType; }
        public void setChatType(String chatType) { this.chatType = chatType; }
        
        public Long getTargetId() { return targetId; }
        public void setTargetId(Long targetId) { this.targetId = targetId; }
        
        public boolean isTyping() { return typing; }
        public void setTyping(boolean typing) { this.typing = typing; }
    }
}