package top.contins.linx.model.dto;

import lombok.Data;

@Data
public class CreateRoomDto {
    private String name;
    private String gameName;
    private Integer maxMembers;
    private String virtualIp;
    private String connectionMode;
}

