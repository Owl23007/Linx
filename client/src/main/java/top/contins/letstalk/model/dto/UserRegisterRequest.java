package top.contins.letstalk.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户注册请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRegisterRequest {

    /**
     * 用户名
     */
    private String username;

    /**
     * 密码
     */
    private String password;

    /**
     * 确认密码
     */
    private String confirmPassword;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 验证码
     */
    private String captcha;
}
