package top.contins.linx.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * WebSocket 连接池管理服务
 * 使用 ConcurrentHashMap 存储会话，支持 Redis 集群同步
 */
@Slf4j
@Service
public class ConnectionPoolService {

    private static final String WS_SESSION_PREFIX = "ws:session:";
    private static final String WS_USER_PREFIX = "ws:user:";
    private static final long SESSION_TIMEOUT_MINUTES = 30;

    // 本地会话存储 (sessionId -> WebSocketSession)
    private final Map<String, WebSocketSession> localSessions = new ConcurrentHashMap<>();
    
    // 本地用户ID到会话ID的映射 (userId -> sessionId)
    private final Map<Long, String> userToSessionMap = new ConcurrentHashMap<>();
    
    private final StringRedisTemplate stringRedisTemplate;

    @Autowired
    public ConnectionPoolService(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    /**
     * 添加会话到连接池
     * 
     * @param userId 用户ID
     * @param sessionId 会话ID
     * @param session WebSocket会话对象
     */
    public void addSession(Long userId, String sessionId, WebSocketSession session) {
        if (userId == null || sessionId == null || session == null) {
            log.warn("添加会话失败：参数为空");
            return;
        }

        try {
            // 存储到本地Map
            localSessions.put(sessionId, session);
            userToSessionMap.put(userId, sessionId);

            // 同步到Redis
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            String sessionKey = WS_SESSION_PREFIX + sessionId;
            String userKey = WS_USER_PREFIX + userId;

            stringRedisTemplate.opsForValue().set(
                sessionKey,
                userId + ":" + timestamp,
                SESSION_TIMEOUT_MINUTES,
                TimeUnit.MINUTES
            );

            stringRedisTemplate.opsForValue().set(
                userKey,
                sessionId + ":" + timestamp,
                SESSION_TIMEOUT_MINUTES,
                TimeUnit.MINUTES
            );

            log.info("会话已添加到连接池: userId={}, sessionId={}", userId, sessionId);

        } catch (Exception e) {
            log.error("添加会话到连接池失败: userId={}, sessionId={}", userId, sessionId, e);
        }
    }

    /**
     * 从连接池移除会话
     * 
     * @param sessionId 会话ID
     */
    public void removeSession(String sessionId) {
        if (sessionId == null) {
            return;
        }

        try {
            // 从本地Map移除
            WebSocketSession session = localSessions.remove(sessionId);
            
            if (session != null) {
                // 查找并移除用户映射
                userToSessionMap.entrySet().removeIf(entry -> 
                    entry.getValue().equals(sessionId));
            }

            // 从Redis移除
            String sessionKey = WS_SESSION_PREFIX + sessionId;
            String userIdStr = stringRedisTemplate.opsForValue().get(sessionKey);
            
            if (userIdStr != null && userIdStr.contains(":")) {
                String userId = userIdStr.split(":")[0];
                String userKey = WS_USER_PREFIX + userId;
                stringRedisTemplate.delete(userKey);
            }
            
            stringRedisTemplate.delete(sessionKey);

            log.info("会话已从连接池移除: sessionId={}", sessionId);

        } catch (Exception e) {
            log.error("从连接池移除会话失败: sessionId={}", sessionId, e);
        }
    }

    /**
     * 根据用户ID获取会话
     * 
     * @param userId 用户ID
     * @return WebSocket会话，如果不存在返回null
     */
    public WebSocketSession getSessionByUserId(Long userId) {
        if (userId == null) {
            return null;
        }

        String sessionId = userToSessionMap.get(userId);
        if (sessionId != null) {
            return localSessions.get(sessionId);
        }

        return null;
    }

    /**
     * 根据会话ID获取会话
     * 
     * @param sessionId 会话ID
     * @return WebSocket会话，如果不存在返回null
     */
    public WebSocketSession getSessionById(String sessionId) {
        if (sessionId == null) {
            return null;
        }

        return localSessions.get(sessionId);
    }

    /**
     * 检查用户是否在线（本地检查）
     * 
     * @param userId 用户ID
     * @return true-在线，false-离线
     */
    public boolean isUserOnlineLocal(Long userId) {
        if (userId == null) {
            return false;
        }

        return userToSessionMap.containsKey(userId);
    }

    /**
     * 检查用户是否在线（包括Redis检查）
     * 
     * @param userId 用户ID
     * @return true-在线，false-离线
     */
    public boolean isUserOnline(Long userId) {
        if (userId == null) {
            return false;
        }

        // 先检查本地
        if (isUserOnlineLocal(userId)) {
            return true;
        }

        // 检查Redis（可能在其他服务器节点）
        try {
            String userKey = WS_USER_PREFIX + userId;
            return Boolean.TRUE.equals(stringRedisTemplate.hasKey(userKey));
        } catch (Exception e) {
            log.error("检查用户在线状态失败: userId={}", userId, e);
            return false;
        }
    }

    /**
     * 获取所有在线用户ID（本地）
     * 
     * @return 在线用户ID集合
     */
    public Set<Long> getOnlineUserIdsLocal() {
        return userToSessionMap.keySet();
    }

    /**
     * 获取在线用户数量（本地）
     * 
     * @return 在线用户数
     */
    public int getOnlineCountLocal() {
        return userToSessionMap.size();
    }

    /**
     * 刷新会话超时时间
     * 
     * @param userId 用户ID
     * @param sessionId 会话ID
     */
    public void refreshSession(Long userId, String sessionId) {
        if (userId == null || sessionId == null) {
            return;
        }

        try {
            String sessionKey = WS_SESSION_PREFIX + sessionId;
            String userKey = WS_USER_PREFIX + userId;

            // 延长Redis中的过期时间
            stringRedisTemplate.expire(sessionKey, SESSION_TIMEOUT_MINUTES, TimeUnit.MINUTES);
            stringRedisTemplate.expire(userKey, SESSION_TIMEOUT_MINUTES, TimeUnit.MINUTES);

            log.debug("会话已刷新: userId={}, sessionId={}", userId, sessionId);

        } catch (Exception e) {
            log.error("刷新会话失败: userId={}, sessionId={}", userId, sessionId, e);
        }
    }

    /**
     * 清理所有会话（用于服务关闭时）
     */
    public void clearAllSessions() {
        log.info("清理所有本地会话: count={}", localSessions.size());
        
        localSessions.clear();
        userToSessionMap.clear();
    }

    /**
     * 获取会话统计信息
     * 
     * @return 统计信息字符串
     */
    public String getSessionStats() {
        return String.format("本地会话数: %d, 在线用户数: %d", 
            localSessions.size(), 
            userToSessionMap.size());
    }
}
