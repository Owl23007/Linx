package top.contins.linx.model.vo;

import java.time.LocalDateTime;

/**
 * Supernode响应VO
 */
public class SupernodeVO {
    
    /**
     * 唯一标识
     */
    private String id;
    
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
    private Integer port;
    
    /**
     * 连接状态
     */
    private String status;
    
    /**
     * 延迟时间(毫秒)
     */
    private Long latency;
    
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
    
    /**
     * 最后检测时间
     */
    private LocalDateTime lastChecked;
    
    /**
     * 创建时间
     */
    private LocalDateTime createTime;
    
    /**
     * 完整地址 (host:port)
     */
    private String fullAddress;
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
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
        this.fullAddress = this.host + ":" + (this.port != null ? this.port : "");
    }
    
    public Integer getPort() {
        return port;
    }
    
    public void setPort(Integer port) {
        this.port = port;
        this.fullAddress = (this.host != null ? this.host : "") + ":" + this.port;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Long getLatency() {
        return latency;
    }
    
    public void setLatency(Long latency) {
        this.latency = latency;
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
    
    public LocalDateTime getLastChecked() {
        return lastChecked;
    }
    
    public void setLastChecked(LocalDateTime lastChecked) {
        this.lastChecked = lastChecked;
    }
    
    public LocalDateTime getCreateTime() {
        return createTime;
    }
    
    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
    
    public String getFullAddress() {
        return fullAddress;
    }
    
    public void setFullAddress(String fullAddress) {
        this.fullAddress = fullAddress;
    }
}