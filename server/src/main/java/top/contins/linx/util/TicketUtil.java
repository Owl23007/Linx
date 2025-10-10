package top.contins.linx.util;

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
            return null;
        }

        String key = TICKET_PREFIX + ticket;
        String value = stringRedisTemplate.opsForValue().get(key);
        if (value == null) {
            return null;
        }

        // 删除 ticket（一次性使用）
        stringRedisTemplate.delete(key);

        // 解析 userId 和 jti
        String[] parts = value.split(":", 2);
        if (parts.length != 2) {
            throw new SecurityException("Invalid ticket format");
        }

        Long userId = Long.parseLong(parts[0]);
        String jti = parts[1];

        // 重建 UserSession
        return new UserSession(userId, jti);
    }
}
