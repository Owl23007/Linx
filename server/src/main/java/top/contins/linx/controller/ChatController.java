package top.contins.linx.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import top.contins.linx.model.common.UserSession;
import top.contins.linx.model.common.Result;
import top.contins.linx.service.WebsocketService;

import java.util.Map;

@RestController
@RequestMapping("/chat")
public class ChatController {
    private final ApplicationContext applicationContext;
    private final WebsocketService websocketService;

    @Autowired
    public ChatController(ApplicationContext applicationContext, WebsocketService websocketService) {
        this.applicationContext = applicationContext;
        this.websocketService = websocketService;
    }
    @GetMapping("/ticket")
    public Result<String> getTicket(){
        UserSession userSession = applicationContext.getBean(UserSession.class);
        Long currentUserId = userSession.getUserLongId();
        String jti = userSession.getTokenJti();
        String ticket = websocketService.createTicket(currentUserId, jti);
        // 返回生成的 ticket
        return Result.success("获取 WebSocket Ticket 成功", ticket);
    }

    /**
     * 建立 WebSocket 会话
     * 前端在建立 WebSocket 连接前先调用此接口，将用户信息存储到 HTTP Session 中
     * 后续的 WebSocket 握手会从 Session 中读取用户信息
     */
    @PostMapping("/link")
    public Result<Map<String, String>> establishWebSocketSession(HttpServletRequest request) {
        try {
            // 从当前请求的 UserSession 中获取用户信息（已由 AuthInterceptor 设置）
            UserSession userSession = applicationContext.getBean(UserSession.class);

            if (userSession.getUserLongId() == null || userSession.getUserId() == null) {
                return Result.error("未提供有效身份令牌，请先登录");
            }

            // 获取或创建 HttpSession
            HttpSession session = request.getSession(true);

            // 将用户信息存储到 HttpSession 中，供 WebSocket 握手使用
            session.setAttribute("userId", userSession.getUserId());
            session.setAttribute("userLongId", userSession.getUserLongId());
            session.setAttribute("userRole", userSession.getRole());
            session.setAttribute("userScopes", userSession.getScopes());
            session.setAttribute("tokenJti", userSession.getTokenJti());
            session.setAttribute("tokenType", userSession.getTokenType());

            // 设置会话超时时间（30分钟）
            session.setMaxInactiveInterval(1800);

            return Result.success("WebSocket 会话建立成功", Map.of(
                    "sessionId", session.getId(),
                    "userId", userSession.getUserId(),
                    "message", "可以建立 WebSocket 连接了"
            ));
        } catch (Exception e) {
            return Result.error("建立 WebSocket 会话失败: " + e.getMessage());
        }
    }
}
