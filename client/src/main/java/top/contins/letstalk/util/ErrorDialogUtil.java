package top.contins.letstalk.util;

import javafx.scene.control.*;
import javafx.scene.control.Alert.AlertType;

/**
 * ⚠️ DEPRECATED: JavaFX错误对话框工具类
 * 
 * <p>该工具类属于已弃用的JavaFX客户端，不再进行主动开发。
 * 弃用原因：依赖JavaFX框架，随客户端一起弃用。
 * 
 * <p>推荐替代方案：
 * 请使用 `/front` 目录下Vue.js版本的错误提示组件。
 * 
 * <p>参考价值：
 * - 错误处理的统一封装思路
 * - 用户友好的错误信息展示方式
 * 
 * @deprecated 自2025年1月起弃用，请使用Vue.js版本
 * @author Oii Woof
 */
@Deprecated(since = "2025-01", forRemoval = false)
public class ErrorDialogUtil {

    public static void showError(String title, String message) {
        Alert alert = new Alert(AlertType.ERROR);

        // 设置标题和内容
        alert.setTitle(title);
        alert.setHeaderText(null); // 避免默认错误图标上方的文字
        alert.setContentText(message);


        // 启用内容文本换行
        Label contentLabel = (Label) alert.getDialogPane().getChildren().stream()
                .filter(node -> node instanceof Label)
                .findFirst()
                .orElse(null);

        if (contentLabel != null) {
            contentLabel.setWrapText(true);
            contentLabel.setMaxWidth(400);
            contentLabel.setMaxHeight(Double.MAX_VALUE);
        }

        // 显示并等待
        alert.showAndWait();
    }

    public static void showError(String message) {
        showError("错误", message);
    }
}

