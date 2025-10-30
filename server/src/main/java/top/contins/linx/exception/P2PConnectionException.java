package top.contins.linx.exception;

/**
 * P2P连接异常
 */
public class P2PConnectionException extends RuntimeException {
    
    public P2PConnectionException(String message) {
        super(message);
    }

    public P2PConnectionException(String message, Throwable cause) {
        super(message, cause);
    }
}
