package top.contins.linx.model.entity;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * <h1>用户在线状态枚举</h1><br>
 * <h2>用于聊天系统中表示用户当前的可达性与通知偏好</h2>
 * <p>
 * - value() 方法用于序列化为 JSON 字符串<br>
 * - 中文描述用于前端展示和日志
 */
public enum UserStatus {

    ONLINE("online", "在线"),
    OFFLINE("offline", "离线"),
    AWAY("away", "离开"),
    DND("dnd", "勿打扰"),
    HIDDEN("hidden", "隐身");

    private final String value;     // 序列化到 JSON 的值（小写，API 用）
    /**
     * -- GETTER --
     *  获取中文描述（用于前端展示、日志、管理后台）
     */
    @Getter
    private final String zhLabel;   // 中文展示标签

    UserStatus(String value, String zhLabel) {
        this.value = value;
        this.zhLabel = zhLabel;
    }

    /**
     * 获取用于 JSON 序列化的值（如：{"status": "dnd"}）
     * Spring Boot 默认会调用此方法，无需额外配置
     */
    @JsonValue
    public String getValue() {
        return value;
    }

    /**
     * 通过 JSON 值反序列化（如："dnd" → DND）
     * JPA/Hibernate/Spring 会自动使用此方法解析请求体
     */
    public static UserStatus fromValue(String value) {
        if (value == null) return OFFLINE;
        for (UserStatus status : values()) {
            if (status.value.equals(value.toLowerCase())) {
                return status;
            }
        }
        throw new IllegalArgumentException("未知的用户状态: " + value);
    }

    /**
     * 是否为“可见在线”状态（即：用户在系统中是“活跃”的）
     * 用于判断是否出现在好友在线列表
     */
    public boolean isVisible() {
        return this != OFFLINE && this != HIDDEN; // 如果加了 HIDDEN，也排除
    }

    /**
     * 是否为“静音”状态（不推送通知）
     */
    public boolean isDoNotDisturb() {
        return this == DND;
    }

    /**
     * 是否为“空闲/非活跃”状态
     */
    public boolean isIdle() {
        return this == AWAY || this == DND;
    }

    /**
     * 是否允许接收消息（所有状态都允许，DND 也只是不通知）
     * 除非是 HIDDEN，否则消息都应送达
     */
    public boolean allowsMessaging() {
        return true; // 所有状态都允许接收消息，仅通知行为不同
    }
    }