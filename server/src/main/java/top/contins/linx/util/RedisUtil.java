package top.contins.linx.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class RedisUtil {
    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public RedisUtil(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // 设置值，带过期时间
    public void set(String key, Object value, Duration timeout) {
        redisTemplate.opsForValue().set(key, value, timeout);
    }

    // 设置值，无过期时间
    public void set(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    // 获取值
    public <T> T get(String key, Class<T> clazz) {
        Object value = redisTemplate.opsForValue().get(key);
        if (value == null) return null;
        return clazz.cast(value);
    }

    // 删除
    public void delete(String key) {
        redisTemplate.delete(key);
    }
}
