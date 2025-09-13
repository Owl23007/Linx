package top.contins.linx.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.event.EventListener;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import top.contins.linx.model.vo.Result;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.springframework.http.HttpMethod.POST;

@Component
@Slf4j
public class ServiceRegistrar {

    @Value("${spring.application.name}")
    private String serviceName;

    @Value("${service.serverLocate}")
    private String serviceEndpoint;

    @Value("${service.pathPrefix}")
    private String pathPrefix;

    // 预共享密钥 —— 必须与 AuthService 中配置一致
    @Value("${upstream.auth-service.secret:linx-shared-secret-2025!}")
    private String sharedKey;

    // AuthService 地址
    @Value("${upstream.auth-service.endpoint}")
    private String authServiceUrl;

    private final JwtUtil jwtUtil;

    @Autowired
    public ServiceRegistrar(@Lazy JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final AtomicBoolean registered = new AtomicBoolean(false);

    // 应用启动完成后自动注册
    @EventListener(ApplicationReadyEvent.class)
    public void registerOnStartup() {
        try {
            registerService();
        } catch (Exception e) {
            log.error(" 服务注册失败，请检查网络或配置", e);
        }
    }

    public void registerService() throws Exception {
        if (registered.get()) {
            log.info("服务已注册，跳过重复注册");
            return;
        }

        log.info("开始向 AuthService 注册服务: {}", serviceName);

        // Step 1: 请求 Challenge
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setServiceName(serviceName);
        registerRequest.setEndpoint(serviceEndpoint);
        registerRequest.setPathPrefix(pathPrefix);

        String registerUrl = authServiceUrl + "/service-registry/register";
        ResponseEntity<Result<ChallengeResponse>> challengeResponse = restTemplate.exchange(
                registerUrl,
                POST,
                new HttpEntity<>(registerRequest, createJsonHeaders()),
                new ParameterizedTypeReference<>() {
                }
        );

        if (!challengeResponse.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("AuthService 返回非200: " + challengeResponse.getStatusCode());
        }

        Result<ChallengeResponse> resultBody = challengeResponse.getBody();
        if (resultBody == null || resultBody.getData() == null) {
            throw new RuntimeException("未收到 Challenge");
        }
        ChallengeResponse challenge = resultBody.getData();
        log.info("服务注册成功，开始获取 Challenge" );

        // Step 2: 生成签名
        String dataToSign = challenge.getNonce() + "|" + challenge.getTimestamp();
        String signature = calculateHmac(sharedKey, dataToSign);

        // Step 3: 提交签名响应
        ChallengeResponseRequest challengeResponseRequest = new ChallengeResponseRequest();
        challengeResponseRequest.setServiceName(serviceName);
        challengeResponseRequest.setSignature(signature);
        challengeResponseRequest.setOriginalRequest(registerRequest);

        String challengeResponseUrl = authServiceUrl + challenge.getEndpoint();
        ResponseEntity<Map> result = restTemplate.postForEntity(
                challengeResponseUrl,
                new HttpEntity<>(challengeResponseRequest, createJsonHeaders()),
                Map.class
        );

        if (!result.getStatusCode().is2xxSuccessful() || result.getBody() == null) {
            throw new RuntimeException("注册响应失败: " + result);
        }

        Object code = result.getBody().get("code");
        if (!"0".equals(String.valueOf(code))) {
            Object msg = result.getBody().get("message");
            throw new RuntimeException("注册失败: " + msg);
        }

        log.info("服务注册成功: {}", result.getBody().get("message"));

        String jwtKey = result.getBody().get("data").toString();
        jwtUtil.setPublicKey(jwtKey);
        registered.set(true);
    }

    private HttpHeaders createJsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    // HMAC-SHA256 签名工具方法（与 AuthService 一致）
    private String calculateHmac(String key, String data) throws Exception {
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hash);
    }

    // ===== DTOs =====

    @Data
    public static class RegisterRequest {
        private String serviceName;
        private String endpoint;
        private String pathPrefix;
    }

    @Data
    public static class ChallengeResponse {
        private String endpoint; // 下一跳提交地址
        private String nonce;
        private long timestamp;
    }

    @Data
    public static class ChallengeResponseRequest {
        private String serviceName;
        private String signature;
        private RegisterRequest originalRequest;
    }
}