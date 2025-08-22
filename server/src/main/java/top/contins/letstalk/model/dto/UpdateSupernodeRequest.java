package top.contins.letstalk.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * 更新Supernode请求DTO
 */
public class UpdateSupernodeRequest {
    
    /**
     * Supernode名称
     */
    private String name;
    
    /**
     * 服务器地址
     */
    private String host;
    
    /**
     * 端口号
     */
    @Min(value = 1, message = "端口号必须大于0")
    @Max(value = 65535, message = "端口号不能超过65535")
    private Integer port;
    
    /**
     * 地理位置
     */
    private String location;
    
    /**
     * 描述信息
     */
    private String description;
    
    /**
     * 是否为默认supernode
     */
    private Boolean isDefault;
    
    // Getters and Setters
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getHost() {
        return host;
    }
    
    public void setHost(String host) {
        this.host = host;
    }
    
    public Integer getPort() {
        return port;
    }
    
    public void setPort(Integer port) {
        this.port = port;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Boolean getIsDefault() {
        return isDefault;
    }
    
    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }
}