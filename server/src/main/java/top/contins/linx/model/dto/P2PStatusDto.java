package top.contins.linx.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * P2P连接状态DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class P2PStatusDto {
    
    /**
     * 连接ID
     */
    private String connectionId;
    
    /**
     * 连接状态（CONNECTING, CONNECTED, DISCONNECTED, ERROR）
     */
    private String status;
    
    /**
     * 用户1是否已连接
     */
    private boolean user1Connected;
    
    /**
     * 用户2是否已连接
     */
    private boolean user2Connected;
    
    /**
     * 状态描述
     */
    private String message;
    
    /**
     * 时间戳
     */
    private long timestamp;
}
