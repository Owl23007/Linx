package top.contins.linx.model.vo;

import lombok.Data;

/**
 * 统一API响应格式
 *
 * @param <T> 响应数据类型
 */
@Data
public class Result<T> {

    /**
     * 响应状态码 (0: 成功, 非0: 失败)
     */
    private Integer code;
    
    /**
     * 响应消息
     */
    private String message;
    
    /**
     * 响应数据
     */
    private T data;
    
    /**
     * 时间戳
     */
    private Long timestamp;
    
    public Result() {
        this.timestamp = System.currentTimeMillis();
    }
    
    public Result(Integer code, String message) {
        this();
        this.code = code;
        this.message = message;
    }
    
    public Result(Integer code, String message, T data) {
        this(code, message);
        this.data = data;
    }
    
    /**
     * 成功响应
     */
    public static <T> Result<T> success() {
        return new Result<>(0, "操作成功");
    }
    
    /**
     * 成功响应带数据
     */
    public static <T> Result<T> success(T data) {
        return new Result<>(0, "操作成功", data);
    }
    
    /**
     * 成功响应带自定义消息
     */
    public static <T> Result<T> success(String message, T data) {
        return new Result<>(0, message, data);
    }
    
    /**
     * 失败响应
     */
    public static <T> Result<T> error(String message) {
        return new Result<>(1, message);
    }
    
    /**
     * 失败响应带状态码
     */
    public static <T> Result<T> error(Integer code, String message) {
        return new Result<>(code, message);
    }

}