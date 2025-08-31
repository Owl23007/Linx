package top.contins.linx.model.vo;

import top.contins.linx.model.entity.Group;

import java.time.LocalDateTime;

/**
 * 群组VO
 */
public class GroupVO {
    
    private Long id;
    private String name;
    private String description;
    private String type;
    private Integer maxMembers;
    private UserVO owner;
    private String status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Integer memberCount;
    
    public GroupVO() {
    }
    
    public GroupVO(Group group) {
        this.id = group.getId();
        this.name = group.getName();
        this.description = group.getDescription();
        this.type = group.getType() != null ? group.getType().name() : null;
        this.maxMembers = group.getMaxMembers();
        this.owner = new UserVO(group.getOwner());
        this.status = group.getStatus() != null ? group.getStatus().name() : null;
        this.createTime = group.getCreateTime();
        this.updateTime = group.getUpdateTime();
        this.memberCount = group.getMemberCount();
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public Integer getMaxMembers() {
        return maxMembers;
    }
    
    public void setMaxMembers(Integer maxMembers) {
        this.maxMembers = maxMembers;
    }
    
    public UserVO getOwner() {
        return owner;
    }
    
    public void setOwner(UserVO owner) {
        this.owner = owner;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public LocalDateTime getCreateTime() {
        return createTime;
    }
    
    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
    
    public LocalDateTime getUpdateTime() {
        return updateTime;
    }
    
    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }
    
    public Integer getMemberCount() {
        return memberCount;
    }
    
    public void setMemberCount(Integer memberCount) {
        this.memberCount = memberCount;
    }
    
    @Override
    public String toString() {
        return "GroupVO{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", type='" + type + '\'' +
                ", status='" + status + '\'' +
                ", memberCount=" + memberCount +
                '}';
    }
}