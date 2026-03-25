package top.contins.linx.model.dto;

import lombok.Data;

@Data
public class JoinRoomDto {
    private String roomCode;
    private String virtualIp;
    private String connectionMode;
}

