package top.contins.linx.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import top.contins.linx.model.common.UserSession;
import top.contins.linx.util.TicketUtil;

import java.util.Map;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;

@Component
public class WsHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WsHandshakeInterceptor.class);
    private final TicketUtil ticketUtil;

    public WsHandshakeInterceptor(TicketUtil ticketUtil) {
        this.ticketUtil = ticketUtil;
    }

    @Override
    public boolean beforeHandshake(
            @NonNull ServerHttpRequest request,
            @NonNull ServerHttpResponse response,
            @NonNull WebSocketHandler wsHandler,
            @NonNull Map<String, Object> attributes) {

        // 检查是否是 WebSocket 升级请求
        if (request instanceof ServletServerHttpRequest servletRequest) {
            String upgrade = servletRequest.getServletRequest().getHeader("Upgrade");
            if (upgrade == null || !upgrade.equalsIgnoreCase("websocket")) {
                log.warn("非 WebSocket 升级请求，Upgrade header: {}", upgrade);
                return false; // 拒绝非 WebSocket 请求
            }
        }

        String ticket = null;
        if (request instanceof ServletServerHttpRequest servletRequest) {
            ticket = servletRequest.getServletRequest().getParameter("ticket");
            log.debug("WebSocket 握手请求，ticket: {}", ticket != null ? ticket.substring(0, Math.min(8, ticket.length())) + "..." : "null");
        }

        if (ticket == null || ticket.trim().isEmpty()) {
            log.warn("WebSocket 握手失败: ticket 参数为空");
            throw new SecurityException("Missing ticket parameter");
        }

        UserSession userSession = ticketUtil.consumeTicket(ticket);
        if (userSession == null) {
            log.warn("WebSocket 握手失败: ticket 无效或已过期");
            throw new SecurityException("Invalid or expired ticket");
        }

        // 关键：将 UserSession 绑定到 WebSocket 会话
        attributes.put("USER_SESSION", userSession);
        log.info("用户 {} 成功建立 WebSocket 连接", userSession.getUserLongId());
        return true;
    }

    @Override
    public void afterHandshake(
            @NonNull ServerHttpRequest request,
            @NonNull ServerHttpResponse response,
            @NonNull WebSocketHandler wsHandler,
            Exception exception) {
        if (exception != null) {
            log.error("WebSocket 握手完成，但发生异常", exception);
        }
    }
}
