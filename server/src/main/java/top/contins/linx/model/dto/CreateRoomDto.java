package top.contins.linx.model.dto;

import lombok.Data;

import java.util.List;

@Data
public class CreateRoomDto {
    private String name;
    private String gameName;
    private Integer maxMembers;
    private String networkSecret;
    private List<String> relayAddresses;
    private String virtualIp;
    private String connectionMode;
}
