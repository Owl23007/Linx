/**
 * ⚠️ DEPRECATED: JavaFX客户端模块配置
 * 
 * 该模块属于已弃用的JavaFX客户端，不再进行主动开发。
 * 弃用原因：JavaFX UI开发复杂度过高，影响开发效率。
 * 
 * 推荐替代方案：请使用 /front 目录下的Vue.js + Electron客户端
 * 
 * 存档价值：
 * - Java模块系统的配置参考
 * - 依赖管理和导出配置的示例
 * 
 * @deprecated 自2025年1月起弃用
 */
module top.contins.letstalk {
    requires javafx.controls;
    requires javafx.fxml;

    requires java.sql;
    requires lombok;
    requires okhttp3;
    requires com.fasterxml.jackson.databind;
    requires annotations;
    requires org.yaml.snakeyaml;

    // 导出主包和 controller 包给 javafx.fxml
    exports top.contins.letstalk;
    exports top.contins.letstalk.controller to javafx.fxml;

    // 打开模块以便反射访问
    opens top.contins.letstalk to javafx.fxml;
    opens top.contins.letstalk.controller to javafx.fxml;
}
