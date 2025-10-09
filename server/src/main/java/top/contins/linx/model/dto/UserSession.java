package top.contins.linx.model.dto;

import lombok.Data;

@Data
public class UserSession {
    private String userId;          // X-User-ID
    private Long userLongId;        // X-User-Long-ID
    private String role;            // X-User-Role
    private String scopes;          // X-User-Scopes
    private String tokenJti;        // X-Token-JTI
    private String tokenType;       // X-Token-Type
}