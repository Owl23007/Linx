package top.contins.linx.model.vo;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.entity.User;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserVO {
    private Long id; // 来源：Auth 服务，唯一标识用户，不可修改

    private String status;

    private LocalDateTime lastSeenAt;

    public UserVO(User user){
        if (user != null) {
            this.id = user.getId();
            this.status = user.getStatus() != null ? user.getStatus().getValue() : "offline";
            this.lastSeenAt = user.getLastSeenAt();
        }
    }
}