package top.contins.linx.model.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSession {
    private String userId;          // X-User-ID
    private Long userLongId;        // X-User-Long-ID
    private String role;            // X-User-Role
    private String scopes;          // X-User-Scopes
    private String tokenJti;        // X-Token-JTI
    private String tokenType;       // X-Token-Type

    public UserSession(Long userLongId, String jti) {
        this.userLongId = userLongId;
        this.tokenJti = jti;
        this.tokenType = "websocket";
        this.role = "user";
        this.scopes = "linx";
        this.userId = String.valueOf(userLongId);
    }
}