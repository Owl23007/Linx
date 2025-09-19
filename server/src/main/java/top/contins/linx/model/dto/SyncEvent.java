package top.contins.linx.model.dto;

import lombok.Data;

@Data
public class SyncEvent {
    private String eventType;
    private String userId;
    private String userStatus;
    private long timestamp;
    private String source = "auth_db"; // 默认来源

    // 无参构造函数
    public SyncEvent() {}

    // 有参构造函数
    public SyncEvent(String eventType, String userId, String userStatus) {
        this.eventType = eventType;
        this.userId = userId;
        this.userStatus = userStatus;
        this.timestamp = System.currentTimeMillis();
    }
}