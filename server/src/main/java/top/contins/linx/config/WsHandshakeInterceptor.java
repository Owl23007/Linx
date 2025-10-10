package top.contins.linx.config;

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

        String ticket = null;
        if (request instanceof ServletServerHttpRequest servletRequest) {
            ticket = servletRequest.getServletRequest().getParameter("ticket");
        }

        UserSession userSession = ticketUtil.consumeTicket(ticket);
        if (userSession == null) {
            throw new SecurityException("Invalid or expired ticket");
        }

        // 关键：将 UserSession 绑定到 WebSocket 会话
        attributes.put("USER_SESSION", userSession);
        return true;
    }

    @Override
    public void afterHandshake(
            @NonNull ServerHttpRequest request,
            @NonNull ServerHttpResponse response,
            @NonNull WebSocketHandler wsHandler,
            Exception exception) {
        // 可用于清理资源
    }
}
