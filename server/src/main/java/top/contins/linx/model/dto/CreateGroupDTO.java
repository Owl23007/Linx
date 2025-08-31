package top.contins.linx.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 创建群组DTO
 */
public class CreateGroupDTO {
    
    /**
     * 群组名称
     */
    @NotBlank(message = "群组名称不能为空")
    @Size(min = 1, max = 50, message = "群组名称长度应在1-50字符之间")
    private String name;
    
    /**
     * 群组描述
     */
    @Size(max = 200, message = "群组描述不能超过200字符")
    private String description;
    
    /**
     * 群组类型
     */
    private String type = "NORMAL";
    
    /**
     * 最大成员数
     */
    private Integer maxMembers = 100;
    
    public CreateGroupDTO() {
    }
    
    public CreateGroupDTO(String name, String description) {
        this.name = name;
        this.description = description;
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
    
    @Override
    public String toString() {
        return "CreateGroupDTO{" +
                "name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", type='" + type + '\'' +
                ", maxMembers=" + maxMembers +
                '}';
    }
}