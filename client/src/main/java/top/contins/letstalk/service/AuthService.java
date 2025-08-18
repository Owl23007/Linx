package top.contins.letstalk.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import top.contins.letstalk.model.dto.UserLoginRequest;
import top.contins.letstalk.model.dto.UserRegisterRequest;
import top.contins.letstalk.model.vo.ApiResponse;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;

/**
 * 认证服务类
 */
public class AuthService {

    private static final String BASE_URL = "https://localhost:8081";
    private final OkHttpClient client;
    private final ObjectMapper objectMapper;

    public AuthService() {
        this.client = new OkHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 获取验证码
     */
    public CompletableFuture<String> getCaptcha() {
        return CompletableFuture.supplyAsync(() -> {
            Request request = new Request.Builder()
                    .url(BASE_URL + "/auth/captcha")
                    .get()
                    .build();

            try (Response response = client.newCall(request).execute()) {
                if (response.isSuccessful() && response.body() != null) {
                    return response.body().string();
                }
                throw new RuntimeException("获取验证码失败: " + response.code());
            } catch (IOException e) {
                throw new RuntimeException("网络错误: " + e.getMessage(), e);
            }
        });
    }

    /**
     * 用户登录
     */
    public CompletableFuture<ApiResponse<Object>> login(UserLoginRequest loginRequest) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String json = objectMapper.writeValueAsString(loginRequest);
                RequestBody body = RequestBody.create(json, MediaType.get("application/json; charset=utf-8"));

                Request request = new Request.Builder()
                        .url(BASE_URL + "/auth/login")
                        .post(body)
                        .build();

                try (Response response = client.newCall(request).execute()) {
                    if (response.body() != null) {
                        String responseBody = response.body().string();
                        if (response.isSuccessful()) {
                            return new ApiResponse<>(200, "登录成功", responseBody);
                        } else {
                            return new ApiResponse<>(response.code(), "登录失败", null);
                        }
                    }
                    return new ApiResponse<>(500, "响应为空", null);
                }
            } catch (IOException e) {
                return new ApiResponse<>(500, "网络错误: " + e.getMessage(), null);
            }
        });
    }

    /**
     * 用户注册
     */
    public CompletableFuture<ApiResponse<Object>> register(UserRegisterRequest registerRequest) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String json = objectMapper.writeValueAsString(registerRequest);
                RequestBody body = RequestBody.create(json, MediaType.get("application/json; charset=utf-8"));

                Request request = new Request.Builder()
                        .url(BASE_URL + "/auth/register")
                        .post(body)
                        .build();

                try (Response response = client.newCall(request).execute()) {
                    if (response.body() != null) {
                        String responseBody = response.body().string();
                        if (response.isSuccessful()) {
                            return new ApiResponse<>(200, "注册成功", responseBody);
                        } else {
                            return new ApiResponse<>(response.code(), "注册失败", null);
                        }
                    }
                    return new ApiResponse<>(500, "响应为空", null);
                }
            } catch (IOException e) {
                return new ApiResponse<>(500, "网络错误: " + e.getMessage(), null);
            }
        });
    }

    /**
     * 用户登出
     */
    public CompletableFuture<ApiResponse<Object>> logout() {
        return CompletableFuture.supplyAsync(() -> {
            Request request = new Request.Builder()
                    .url(BASE_URL + "/auth/logout")
                    .post(RequestBody.create("", MediaType.get("application/json")))
                    .build();

            try (Response response = client.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    return new ApiResponse<>(200, "登出成功", null);
                } else {
                    return new ApiResponse<>(response.code(), "登出失败", null);
                }
            } catch (IOException e) {
                return new ApiResponse<>(500, "网络错误: " + e.getMessage(), null);
            }
        });
    }
}
