package top.contins.letstalk;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;
import javafx.stage.StageStyle;

import java.io.IOException;

/**
 * ⚠️ DEPRECATED: JavaFX客户端应用程序
 * 
 * <p>该JavaFX客户端已被弃用，不再进行主动开发。
 * 弃用原因：UI开发复杂度过高，影响开发效率。
 * 
 * <p>推荐使用替代方案：
 * - 请使用 `/front` 目录下的 Vue.js + Electron 客户端
 * - 该版本提供更现代化的开发体验和更好的UI框架
 * 
 * <p>存档价值：
 * 该代码保留用于参考和可能的代码复用，包含规范化的架构设计。
 * 
 * @deprecated 自2025年1月起弃用，请使用Vue.js版本
 * @author Oii Woof
 */
@Deprecated(since = "2025-01", forRemoval = false)
public class ClientApplication extends Application {
    @Override
    public void start(Stage stage) throws IOException {
        FXMLLoader fxmlLoader = new FXMLLoader(ClientApplication.class.getResource("auth-view.fxml"));
        Scene scene = new Scene(fxmlLoader.load(), 320, 450);

        // 设置透明窗口和圆角
        stage.initStyle(StageStyle.TRANSPARENT);
        scene.setFill(null);
        scene.getRoot().setStyle(
                "-fx-background-radius: 8; -fx-border-radius: 8;");

        stage.setTitle("登录/注册");
        stage.setScene(scene);
        stage.show();
    }

    public static void main(String[] args) {
        launch();
    }
}