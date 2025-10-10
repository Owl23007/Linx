package top.contins.linx.model.dto;

/**
 * 消息类型枚举
 */
public enum MessageType {
    /**
     * 聊天消息
     */
    CHAT,

    /**
     * 用户加入
     */
    JOIN,

    /**
     * 用户离开
     */
    LEAVE,

    /**
     * 心跳消息
     */
    HEARTBEAT,

    /**
     * 系统通知
     */
    SYSTEM,

    /**
     * 输入状态（正在输入...）
     */
    TYPING,

    /**
     * 已读回执
     */
    READ_RECEIPT,

    /**
     * 文件消息
     */
    FILE,

    /**
     * 图片消息
     */
    IMAGE,

    /**
     * 语音消息
     */
    VOICE,

    /**
     * 视频消息
     */
    VIDEO
}
