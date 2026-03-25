package top.contins.linx.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import top.contins.linx.model.common.Result;
import top.contins.linx.model.common.UserSession;
import top.contins.linx.model.dto.CreateRoomDto;
import top.contins.linx.model.dto.JoinRoomDto;
import top.contins.linx.model.vo.RoomVO;
import top.contins.linx.service.RoomService;

import java.util.List;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService roomService;
    private final ApplicationContext applicationContext;

    @Autowired
    public RoomController(RoomService roomService, ApplicationContext applicationContext) {
        this.roomService = roomService;
        this.applicationContext = applicationContext;
    }

    @PostMapping
    public Result<RoomVO> createRoom(@RequestBody CreateRoomDto dto) {
        try {
            Long currentUserId = getCurrentUserId();
            RoomVO room = roomService.createRoom(currentUserId, dto);
            return Result.success("创建房间成功", room);
        } catch (Exception e) {
            return Result.error("创建房间失败: " + e.getMessage());
        }
    }

    @PostMapping("/join")
    public Result<RoomVO> joinRoom(@RequestBody JoinRoomDto dto) {
        try {
            Long currentUserId = getCurrentUserId();
            RoomVO room = roomService.joinRoom(currentUserId, dto);
            return Result.success("加入房间成功", room);
        } catch (Exception e) {
            return Result.error("加入房间失败: " + e.getMessage());
        }
    }

    @GetMapping("/mine")
    public Result<List<RoomVO>> getMyRooms() {
        try {
            Long currentUserId = getCurrentUserId();
            List<RoomVO> roomList = roomService.getMyRooms(currentUserId);
            return Result.success("获取房间列表成功", roomList);
        } catch (Exception e) {
            return Result.error("获取房间列表失败: " + e.getMessage());
        }
    }

    @GetMapping("/{roomId}")
    public Result<RoomVO> getRoomDetails(@PathVariable Long roomId) {
        try {
            Long currentUserId = getCurrentUserId();
            RoomVO room = roomService.getRoomDetails(roomId, currentUserId);
            return Result.success("获取房间详情成功", room);
        } catch (Exception e) {
            return Result.error("获取房间详情失败: " + e.getMessage());
        }
    }

    private Long getCurrentUserId() {
        UserSession userSession = applicationContext.getBean(UserSession.class);
        if (userSession.getUserLongId() == null) {
            throw new RuntimeException("用户未登录");
        }
        return userSession.getUserLongId();
    }
}

