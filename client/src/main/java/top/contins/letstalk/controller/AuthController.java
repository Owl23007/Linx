package top.contins.letstalk.controller;

import javafx.animation.Interpolator;
import javafx.animation.KeyFrame;
import javafx.animation.KeyValue;
import javafx.animation.Timeline;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.stage.Stage;
import javafx.util.Duration;
import top.contins.letstalk.config.ConfigInjector;
import top.contins.letstalk.config.Value;
import top.contins.letstalk.util.ErrorDialogUtil;
import top.contins.letstalk.util.LogUtil;

public class AuthController {

    public Label passwordLabel;

    public HBox toggleContainer;

    public Region slider;

    public StackPane toggleStack;

    public Label titleLabel;

    @FXML
    private TextField usernameField;

    @FXML
    private PasswordField passwordField;

    @FXML
    private TextField emailField;

    @FXML
    private PasswordField confirmPasswordField;

    @FXML
    private TextField captchaField;

    @FXML
    private Button loginModeBtn;

    @FXML
    private Button registerModeBtn;

    @FXML
    private Button primaryActionBtn;

    @FXML
    private Button captchaBtn;

    @FXML
    private Label emailLabel;

    @FXML
    private Label confirmPasswordLabel;

    @FXML
    private Label statusLabel;

    private double xOffset = 0;
    private double yOffset = 0;
    private boolean isLoginMode = true;
    private String currentCaptcha = "";

    @Value("app.name")
    private String appName;

    private static final LogUtil log = LogUtil.getLogger(AuthController.class);

    public void initialize() {
        // 初始化时切换到登录模式
        switchToLogin();
        // 自动注入配置项
        ConfigInjector.injectConfigValues(this);
        if (appName != null && !appName.isEmpty()) {
            titleLabel.setText(appName);
        } else {
            titleLabel.setText("Let's Talk");
        }
    }

    @FXML
    private void switchToLogin() {
        loginModeBtn.getStyleClass().add("selected");
        registerModeBtn.getStyleClass().remove("selected");
        animateSliderTo(-50);
        isLoginMode = true;
    }

    @FXML
    private void switchToRegister() {
        loginModeBtn.getStyleClass().remove("selected");
        registerModeBtn.getStyleClass().add("selected");
        animateSliderTo(50);
        isLoginMode = false;
    }

    // 动画方法
    private void animateSliderTo(double targetX) {
        Timeline timeline = new Timeline(
                new KeyFrame(
                        Duration.millis(300),
                        new KeyValue(slider.translateXProperty(), targetX, Interpolator.EASE_BOTH)
                )
        );
        timeline.play();
    }

    @FXML
    private void refreshCaptcha() {
        captchaBtn.setDisable(true);
        captchaBtn.setText("获取中...");
    }

    @FXML
    private void handlePrimaryAction() {
        if (isLoginMode) {
            handleLogin();
        } else {
            handleRegister();
        }
    }

    private void handleLogin() {
        String username = usernameField.getText().trim();
        String password = passwordField.getText();
        String captcha = captchaField.getText().trim();

        log.info("用户尝试登录: " + username);
        try {
            // 验证输入
            if (username.isEmpty()) {
                showStatus("请输入用户名", false);
                return;
            }
            if (password.isEmpty()) {
                showStatus("请输入密码", false);
                return;
            }
            if (captcha.isEmpty()) {
                showStatus("请输入验证码", false);
                return;
            }

            primaryActionBtn.setDisable(true);
            primaryActionBtn.setText("登录中...");
            showStatus("正在登录...", true);
        } catch (Exception e) {
            log.error("登录异常", e);
            ErrorDialogUtil.showError("登录失败", e.getMessage());
        } finally {
            primaryActionBtn.setDisable(false);
            primaryActionBtn.setText("登录");
        }
    }

    private void handleRegister() {
        String username = usernameField.getText().trim();
        String email = emailField.getText().trim();
        String password = passwordField.getText();
        String confirmPassword = confirmPasswordField.getText();
        String captcha = captchaField.getText().trim();

        log.info("用户尝试注册: {}, 邮箱: {}", username, email);

        try {
            // 验证输入
            if (username.isEmpty()) {
                showStatus("请输入用户名", false);
                return;
            }
            if (email.isEmpty()) {
                showStatus("请输入邮箱", false);
                return;
            }
            if (password.isEmpty()) {
                showStatus("请输入密码", false);
                return;
            }
            if (confirmPassword.isEmpty()) {
                showStatus("请确认密码", false);
                return;
            }
            if (!password.equals(confirmPassword)) {
                showStatus("两次输入的密码不一致", false);
                return;
            }
            if (captcha.isEmpty()) {
                showStatus("请输入验证码", false);
                return;
            }

            primaryActionBtn.setDisable(true);
            primaryActionBtn.setText("注册中...");
            showStatus("正在注册...", true);
            // ...业务逻辑...
        } catch (Exception e) {

            log.error("注册异常", e);

            ErrorDialogUtil.showError("注册失败", e.getMessage());
        } finally {
            primaryActionBtn.setDisable(false);
            primaryActionBtn.setText("注册");
        }
    }

    private void showStatus(String message, boolean isSuccess) {
        statusLabel.setText(message);
        statusLabel.getStyleClass().clear();
        statusLabel.getStyleClass().add("auth-status");
        if (isSuccess) {
            statusLabel.getStyleClass().add("success");
        } else {
            statusLabel.getStyleClass().add("error");
        }
    }

    public void closeAction(ActionEvent event) {
        // 获取当前窗口��关闭
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.close();
    }

    @FXML
    private void onMousePressed(MouseEvent event) {
        // 记录鼠标按下时的初始位置
        xOffset = event.getSceneX();
        yOffset = event.getSceneY();
    }

    @FXML
    private void onMouseDragged(MouseEvent event) {
        // 计算并设置窗口新位置
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setX(event.getScreenX() - xOffset);
        stage.setY(event.getScreenY() - yOffset);
    }
}