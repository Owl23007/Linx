package top.contins.linx.util;

import io.jsonwebtoken.*;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.*;
import java.util.stream.Collectors;

/**
 * JWT 工具类（仅用于验证和解析 Token，适用于其他微服务如 linx）
 * <p>
 * 依赖外部注入的 RSA 公钥（从 auth-service 获取）
 * 支持验证签名、过期、audience、role、scope、jti 等
 */
@Getter
@Slf4j
@Component
public class JwtUtil {

    private PublicKey publicKey = null;

    public void setPublicKey(String publicKeyPem) {
        if (publicKeyPem == null || publicKeyPem.trim().isEmpty()) {
            throw new IllegalArgumentException("公钥字符串不能为空");
        }

        try {
            // 去除 PEM 头尾标记和换行符
            String publicKeyContent = publicKeyPem
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");

            // Base64 解码
            byte[] keyBytes = Base64.getDecoder().decode(publicKeyContent);

            // 生成 PublicKey 对象
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            this.publicKey = keyFactory.generatePublic(keySpec);
            log.info("公钥已更新");

        } catch (Exception e) {
            throw new IllegalArgumentException("无法解析公钥，请检查格式是否为标准 PEM", e);
        }
    }

    /**
     * 验证Token（签名 + 过期）
     */
    public boolean validateToken(String token) {
        try {
            getClaimsFromToken(token); // 自动校验签名和过期
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("Token 已过期: {}", e.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT token验证失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 验证刷新Token（签名 + 过期 + 类型）
     */
    public boolean validateRefreshToken(String token) {
        return validateToken(token) && "refresh".equals(getTokenType(token));
    }

    /**
     * 从Token中获取用户名
     */
    public String getUsernameFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.getSubject();
        } catch (Exception e) {
            log.error("从token获取用户名失败", e);
            return null;
        }
    }

    /**
     * 从Token中获取用户ID
     */
    public Long getUserIdFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.get("userId", Long.class);
        } catch (Exception e) {
            log.error("从token获取用户ID失败", e);
            return null;
        }
    }

    /**
     * 从Token中获取邮箱
     */
    public String getEmailFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.get("email", String.class);
        } catch (Exception e) {
            log.error("从token获取邮箱失败", e);
            return null;
        }
    }

    /**
     * 从Token中获取角色
     */
    public String getRoleFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.get("role", String.class);
        } catch (Exception e) {
            log.error("从token获取角色失败", e);
            return null;
        }
    }

    /**
     * 从Token中获取权限域（scope)
     */
    public List<String> getScopesFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            Object scope = claims.get("scope");
            if (scope instanceof List) {
                return ((List<?>) scope).stream()
                        .map(Object::toString)
                        .collect(Collectors.toList());
            } else if (scope instanceof String s) {
                if (s.trim().isEmpty()) {
                    return Collections.emptyList();
                }
                return Arrays.stream(s.split(","))
                        .map(String::trim)
                        .filter(str -> !str.isEmpty())
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.error("从token获取scope失败", e);
        }
        return Collections.emptyList();
    }

    /**
     * 从Token中获取受众服务（audience）
     */
    public List<String> getAudienceFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            Object aud = claims.get("aud");

            if (aud instanceof List) {
                return ((List<?>) aud).stream()
                        .map(Object::toString)
                        .collect(Collectors.toList());
            } else if (aud instanceof String s) {
                if (s.trim().isEmpty()) {
                    return Collections.emptyList();
                }
                return List.of(s.trim());
            }
        } catch (Exception e) {
            log.error("从token获取audience失败", e);
        }
        return Collections.emptyList();
    }

    /**
     * 获取Token类型
     */
    public String getTokenType(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.get("type", String.class);
        } catch (Exception e) {
            log.error("从token获取类型失败", e);
            return null;
        }
    }

    /**
     * 获取JWT唯一ID（jti）
     */
    public String getJtiFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.get("jti", String.class);
        } catch (Exception e) {
            log.error("从token获取jti失败", e);
            return null;
        }
    }

    /**
     * 从Token中获取Claims（统一入口，带异常包装）—— 使用公钥验证
     */
    private Claims getClaimsFromToken(String token) {
        if (publicKey == null) {
            throw new IllegalStateException("RSA公钥未设置，请先调用 setPublicKey()");
        }
        try {
            return Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException e) {
            throw new IllegalArgumentException("无效或过期的 JWT Token", e);
        }
    }

    /**
     * 获取Token剩余有效时间（秒）
     */
    public long getTokenRemainingTime(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            Date expiration = claims.getExpiration();
            long remaining = (expiration.getTime() - System.currentTimeMillis()) / 1000;
            return Math.max(remaining, 0);
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * 检查Token是否包含指定服务权限
     */
    public boolean hasServiceAccess(String token, String serviceName) {
        try {
            List<String> audiences = getAudienceFromToken(token);
            return audiences != null && audiences.contains(serviceName);
        } catch (Exception e) {
            log.warn("检查服务权限失败", e);
            return false;
        }
    }

    /**
     * 检查Token是否具有指定角色
     */
    public boolean hasRole(String token, String role) {
        try {
            String tokenRole = getRoleFromToken(token);
            return role != null && role.equalsIgnoreCase(tokenRole);
        } catch (Exception e) {
            log.warn("检查角色失败", e);
            return false;
        }
    }
}