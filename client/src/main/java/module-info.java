module top.contins.letstalk {
    requires javafx.controls;
    requires javafx.fxml;

    requires java.sql;
    // requires com.mysql.cj.jdbc;
    requires lombok;
    requires okhttp3;
    requires com.fasterxml.jackson.databind;

    // 导出主包和 controller 包给 javafx.fxml
    exports top.contins.letstalk;
    exports top.contins.letstalk.controller to javafx.fxml;

    // 打开模块以便反射访问
    opens top.contins.letstalk to javafx.fxml;
    opens top.contins.letstalk.controller to javafx.fxml;
}
