package top.contins.linx.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * P2P连接信息DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class P2PConnectionDto {
    
    /**
     * 连接ID
     */
    private String connectionId;
    
    /**
     * 社区名称
     */
    private String community;
    
    /**
     * 用户1的ID
     */
    private Long userId1;
    
    /**
     * 用户2的ID
     */
    private Long userId2;
    
    /**
     * 用户1的虚拟IP
     */
    private String virtualIp1;
    
    /**
     * 用户2的虚拟IP
     */
    private String virtualIp2;
    
    /**
     * 加密密码
     */
    private String password;
    
    /**
     * 连接状态
     */
    private String status;
}
