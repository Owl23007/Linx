package top.contins.linx.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import top.contins.linx.model.common.UserSession;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * WebSocket 票据工具类
 * 负责票据的创建和验证，与具体的WebSocket配置解耦
 */
@Component
public class TicketUtil {

    private static final Logger log = LoggerFactory.getLogger(TicketUtil.class);
    private static final String TICKET_PREFIX = "ws:ticket:";

    private final StringRedisTemplate stringRedisTemplate;

    @Autowired
    public TicketUtil(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    /**
     * 创建 WebSocket 连接凭证（5分钟有效期）
     *
     * @param userId 用户ID
     * @param jti JWT ID
     * @return 临时 ticket
     */
    public String createTicket(Long userId, String jti) {
        if (userId == null || jti == null) {
            log.error("创建 ticket 失败: userId 或 jti 为空");
            throw new SecurityException("Invalid userId or jti");
        }

        // 拼接存储值：userId:jti
        String value = userId + ":" + jti;

        // 存入 Redis
        String ticket = UUID.randomUUID().toString();
        stringRedisTemplate.opsForValue().set(
                TICKET_PREFIX + ticket,
                value,
                5,
                TimeUnit.MINUTES
        );

        log.debug("为用户 {} 创建 ticket: {}...", userId, ticket.substring(0, 8));
        return ticket;
    }

    /**
     * 验证并消费 ticket，返回重建的 UserSession
     *
     * @param ticket 临时凭证
     * @return UserSession 对象，无效则返回 null
     */
    public UserSession consumeTicket(String ticket) {
        if (ticket == null || ticket.trim().isEmpty()) {
            log.warn("ticket 为空");
            return null;
        }

        String key = TICKET_PREFIX + ticket;
        String value = stringRedisTemplate.opsForValue().get(key);
        if (value == null) {
            log.warn("ticket 不存在或已过期: {}...", ticket.substring(0, Math.min(8, ticket.length())));
            return null;
        }

        // 删除 ticket（一次性使用）
        stringRedisTemplate.delete(key);

        // 解析 userId 和 jti
        String[] parts = value.split(":", 2);
        if (parts.length != 2) {
            log.error("ticket 格式错误: {}", value);
            throw new SecurityException("Invalid ticket format");
        }

        Long userId = Long.parseLong(parts[0]);
        String jti = parts[1];

        log.debug("ticket 验证成功，用户ID: {}", userId);

        // 重建 UserSession
        return new UserSession(userId, jti);
    }
}
