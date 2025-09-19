package top.contins.linx.model.dto;

import lombok.Data;
import top.contins.linx.model.entity.UserStatus;

import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id; // 来源：Auth 服务，唯一标识用户，不可修改

    private UserStatus status = UserStatus.OFFLINE;

    private LocalDateTime lastSeenAt;
}
