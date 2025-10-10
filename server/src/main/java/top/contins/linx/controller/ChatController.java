package top.contins.linx.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import top.contins.linx.model.dto.UserSession;
import top.contins.linx.model.vo.Result;
import top.contins.linx.service.WebsocketService;

@RestController
@RequestMapping("/chat")
public class ChatController {
    private final ApplicationContext applicationContext;
    private final WebsocketService websocketService;

    @Autowired
    public ChatController(ApplicationContext applicationContext, WebsocketService websocketService) {
        this.applicationContext = applicationContext;
        this.websocketService = websocketService;
    }
    @GetMapping("/ticket")
    public Result<String> getTicket(){
        UserSession userSession = applicationContext.getBean(UserSession.class);
        Long currentUserId = userSession.getUserLongId();
        String jti = userSession.getTokenJti();
        String ticket = websocketService.createTicket(currentUserId, jti);
        // 返回生成的 ticket，而不是 jti:userId
        return Result.success("获取 WebSocket Ticket 成功", ticket);
    }
}
