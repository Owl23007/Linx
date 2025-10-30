package top.contins.linx.exception;

/**
 * 文件传输异常
 */
public class FileTransferException extends RuntimeException {
    
    public FileTransferException(String message) {
        super(message);
    }

    public FileTransferException(String message, Throwable cause) {
        super(message, cause);
    }
}
