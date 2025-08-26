package top.contins.linx.model.vo;

import top.contins.linx.model.entity.User;

import java.time.LocalDateTime;

/**
 * 用户信息VO
 */
public class UserVO {
    
    private Long id;
    private String username;
    private String email;
    private String nickname;
    private String status;
    private LocalDateTime lastOnline;
    private LocalDateTime createTime;
    
    public UserVO() {
    }
    
    public UserVO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.nickname = user.getNickname();
        this.status = user.getStatus() != null ? user.getStatus().name() : null;
        this.lastOnline = user.getLastOnline();
        this.createTime = user.getCreateTime();
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getNickname() {
        return nickname;
    }
    
    public void setNickname(String nickname) {
        this.nickname = nickname;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public LocalDateTime getLastOnline() {
        return lastOnline;
    }
    
    public void setLastOnline(LocalDateTime lastOnline) {
        this.lastOnline = lastOnline;
    }
    
    public LocalDateTime getCreateTime() {
        return createTime;
    }
    
    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
    
    @Override
    public String toString() {
        return "UserVO{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", nickname='" + nickname + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}