package top.contins.linx.config;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import top.contins.linx.util.JwtUtil;
import top.contins.linx.service.UserService;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter implements Filter {

    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    // 需要认证的路径前缀（可根据需要调整）
    private static final String[] AUTH_PATHS = {
            "/chat/",
            "/ws/",     // 如果用 WebSocket 握手
            "/api/chat/",
            "/presence/",
            "/user/"
    };

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();

        // 跳过不需要认证的路径
        if (!requiresAuth(path)) {
            chain.doFilter(request, response);
            return;
        }

        String token = resolveToken(httpRequest);

        if (token == null || !jwtUtil.validateToken(token)) {
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            writeResponse(httpResponse, "Invalid or missing token");
            return;
        }

        try {
            // 从 JWT 中提取 user_id
            Long userId = jwtUtil.getUserIdFromToken(token);

            userService.createOrUpdateUser(userId);

            // 核心：处理用户登录状态（初始化 + 更新在线状态）
            userService.updateLastSeenAt(userId, LocalDateTime.now());

            // 将 user_id 设置到 request attribute，供后续 Controller 使用
            httpRequest.setAttribute("CURRENT_USER_ID", userId);

            chain.doFilter(request, response);

        } catch (IllegalArgumentException e) {
            log.warn("身份验证失败: {}", e.getMessage());
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            writeResponse(httpResponse, "Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("ChatAuthFilter error", e);
            httpResponse.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            writeResponse(httpResponse, "Authentication failed");
        }
    }

    private boolean requiresAuth(String path) {
        for (String prefix : AUTH_PATHS) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private void writeResponse(HttpServletResponse response, String message) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String json = objectMapper.writeValueAsString(Map.of("error", message));
        response.getWriter().write(json);
    }
}