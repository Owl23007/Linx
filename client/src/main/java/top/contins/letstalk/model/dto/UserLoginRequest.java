package top.contins.letstalk.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户登录请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserLoginRequest {

    /**
     * 用户名
     */
    private String username;

    /**
     * 密码
     */
    private String password;

    /**
     * 验证码
     */
    private String captcha;
}
