package top.contins.linx.model.entity;

/**
 * 好友关系状态枚举
 */
public enum FriendshipStatus {
    /**
     * 待确认 - 已发送好友请求，等待对方确认
     */
    PENDING,

    /**
     * 已接受 - 双方已成为好友
     */
    ACCEPTED,

    /**
     * 已拒绝 - 好友请求被拒绝
     */
    REJECTED,

    /**
     * 已拉黑 - 用户被拉黑
     */
    BLOCKED
}
