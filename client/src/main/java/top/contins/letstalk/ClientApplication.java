package top.contins.letstalk;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;
import javafx.stage.StageStyle;

import java.io.IOException;

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