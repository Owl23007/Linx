package top.contins.letstalk.util;

import javafx.scene.control.*;
import javafx.scene.control.Alert.AlertType;

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

