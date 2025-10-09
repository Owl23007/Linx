package top.contins.linx.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import org.springframework.web.servlet.HandlerInterceptor;
import top.contins.linx.model.dto.UserSession;
import top.contins.linx.service.UserService;

import java.io.IOException;
import java.util.Enumeration;

@Slf4j
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final UserService userService;
    private final ApplicationContext applicationContext;

    @Autowired
    public AuthInterceptor(UserService userService, ApplicationContext applicationContext) {
        this.userService = userService;
        this.applicationContext = applicationContext;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, @NonNull HttpServletResponse response,@NonNull Object handler) {
        log.info("AuthInterceptor preHandle");
        String shortUserId = request.getHeader("X-User-ID");      // Base62 短 ID
        Long longUserId = parseLong(request.getHeader("X-User-Long-ID")); // Long ID

        // 必须同时存在
        if (shortUserId == null || shortUserId.isEmpty()|| longUserId == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            try {
                response.getWriter().write("{\"message\": \"Invalid user ID\"}");
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            return false;
        }

        // 从当前请求上下文中获取 UserSession
        UserSession session = applicationContext.getBean(UserSession.class);
        session.setUserId(shortUserId);
        session.setUserLongId(longUserId);
        session.setRole(request.getHeader("X-User-Role"));
        session.setScopes(request.getHeader("X-User-Scopes"));
        session.setTokenJti(request.getHeader("X-Token-JTI"));
        session.setTokenType(request.getHeader("X-Token-Type"));

        userService.createOrUpdateUser(longUserId);

        return true;
    }

    private Long parseLong(String s) {
        try {
            return s == null ? null : Long.parseLong(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}