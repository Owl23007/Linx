package top.contins.linx.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 文档配置
 */
@Configuration
public class OpenApiConfig {
    
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Linx - n2n P2P 聊天服务器 API")
                        .description("基于n2n的P2P聊天异地组网软件的服务器端API文档。" +
                                   "提供Supernode服务器管理、P2P网络配置等功能。")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Linx Team")
                                .email("contact@linx.top")
                                .url("https://github.com/Owl23007/Linx"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")));
    }
}