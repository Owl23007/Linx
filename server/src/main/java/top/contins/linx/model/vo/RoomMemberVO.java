package top.contins.linx.model.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.enums.RoomMemberRole;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMemberVO {
    private Long membershipId;
    private Long userId;
    private String displayName;
    private RoomMemberRole role;
    private String virtualIp;
    private String connectionMode;
    private LocalDateTime joinedAt;
    private LocalDateTime lastActiveAt;
}

