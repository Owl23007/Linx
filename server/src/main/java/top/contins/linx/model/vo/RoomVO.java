package top.contins.linx.model.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.enums.RoomMemberRole;
import top.contins.linx.model.enums.RoomStatus;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomVO {
    private Long id;
    private String name;
    private String roomCode;
    private String gameName;
    private String networkName;
    private List<String> relayAddresses;
    private RoomStatus status;
    private Long ownerId;
    private String ownerName;
    private Integer maxMembers;
    private Integer memberCount;
    private RoomMemberRole myRole;
    private String myVirtualIp;
    private String myConnectionMode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RoomMemberVO> members;
}
