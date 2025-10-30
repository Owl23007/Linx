package top.contins.linx.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import top.contins.linx.model.common.Result;
import top.contins.linx.model.dto.P2PConnectionDto;
import top.contins.linx.model.dto.P2PStatusDto;
import top.contins.linx.service.P2PVpnService;
import top.contins.linx.service.P2PVpnService.P2PConnectionInfo;
import top.contins.linx.service.SignalingService;

/**
 * P2P连接控制器
 * 提供P2P连接管理的REST接口
 */
@Slf4j
@RestController
@RequestMapping("/api/p2p")
@Tag(name = "P2P连接管理", description = "P2P VPN连接和文件传输相关接口")
public class P2PController {

    private final SignalingService signalingService;
    private final P2PVpnService p2pVpnService;

    @Autowired
    public P2PController(SignalingService signalingService, P2PVpnService p2pVpnService) {
        this.signalingService = signalingService;
        this.p2pVpnService = p2pVpnService;
    }

    /**
     * 发起P2P连接请求
     * 
     * @param targetUserId 目标用户ID
     * @return P2P连接信息
     */
    @PostMapping("/connect")
    @Operation(summary = "发起P2P连接", description = "向目标用户发起P2P直连请求")
    public ResponseEntity<Result<P2PConnectionDto>> connectP2P(
            @RequestParam Long targetUserId,
            @RequestAttribute("userId") Long currentUserId) {
        
        try {
            P2PConnectionDto connection = signalingService.initiateConnection(
                currentUserId, targetUserId);
            
            return ResponseEntity.ok(Result.success(connection));
            
        } catch (Exception e) {
            log.error("发起P2P连接失败: currentUserId={}, targetUserId={}", 
                currentUserId, targetUserId, e);
            return ResponseEntity.ok(Result.error("发起P2P连接失败: " + e.getMessage()));
        }
    }

    /**
     * 接受P2P连接请求
     * 
     * @param connectionId 连接ID
     * @return P2P连接详情
     */
    @PostMapping("/accept/{connectionId}")
    @Operation(summary = "接受P2P连接", description = "接受对方的P2P连接请求")
    public ResponseEntity<Result<P2PConnectionDto>> acceptConnection(
            @PathVariable String connectionId,
            @RequestAttribute("userId") Long currentUserId) {
        
        try {
            P2PConnectionDto connection = signalingService.acceptConnection(
                connectionId, currentUserId);
            
            return ResponseEntity.ok(Result.success(connection));
            
        } catch (Exception e) {
            log.error("接受P2P连接失败: connectionId={}, userId={}", 
                connectionId, currentUserId, e);
            return ResponseEntity.ok(Result.error("接受P2P连接失败: " + e.getMessage()));
        }
    }

    /**
     * 拒绝P2P连接请求
     * 
     * @param connectionId 连接ID
     * @return 操作结果
     */
    @PostMapping("/reject/{connectionId}")
    @Operation(summary = "拒绝P2P连接", description = "拒绝对方的P2P连接请求")
    public ResponseEntity<Result<Void>> rejectConnection(
            @PathVariable String connectionId,
            @RequestAttribute("userId") Long currentUserId) {
        
        try {
            signalingService.rejectConnection(connectionId, currentUserId);
            return ResponseEntity.ok(Result.success(null));
            
        } catch (Exception e) {
            log.error("拒绝P2P连接失败: connectionId={}, userId={}", 
                connectionId, currentUserId, e);
            return ResponseEntity.ok(Result.error("拒绝P2P连接失败: " + e.getMessage()));
        }
    }

    /**
     * 断开P2P连接
     * 
     * @param connectionId 连接ID
     * @return 操作结果
     */
    @DeleteMapping("/disconnect/{connectionId}")
    @Operation(summary = "断开P2P连接", description = "主动断开P2P连接")
    public ResponseEntity<Result<Void>> disconnectConnection(
            @PathVariable String connectionId,
            @RequestAttribute("userId") Long currentUserId) {
        
        try {
            signalingService.disconnectConnection(connectionId, currentUserId);
            return ResponseEntity.ok(Result.success(null));
            
        } catch (Exception e) {
            log.error("断开P2P连接失败: connectionId={}, userId={}", 
                connectionId, currentUserId, e);
            return ResponseEntity.ok(Result.error("断开P2P连接失败: " + e.getMessage()));
        }
    }

    /**
     * 获取P2P连接状态
     * 
     * @param connectionId 连接ID
     * @return 连接状态
     */
    @GetMapping("/status/{connectionId}")
    @Operation(summary = "获取P2P连接状态", description = "查询P2P连接的当前状态")
    public ResponseEntity<Result<P2PStatusDto>> getConnectionStatus(
            @PathVariable String connectionId) {
        
        try {
            P2PConnectionInfo connectionInfo = p2pVpnService.getConnectionInfo(connectionId);
            
            if (connectionInfo == null) {
                return ResponseEntity.ok(Result.error("连接不存在"));
            }

            boolean isActive = p2pVpnService.isConnectionActive(connectionId);
            
            P2PStatusDto status = new P2PStatusDto(
                connectionId,
                isActive ? "CONNECTED" : "DISCONNECTED",
                connectionInfo.user1Connected,
                connectionInfo.user2Connected,
                isActive ? "连接正常" : "连接已断开",
                System.currentTimeMillis()
            );

            return ResponseEntity.ok(Result.success(status));
            
        } catch (Exception e) {
            log.error("获取P2P连接状态失败: connectionId={}", connectionId, e);
            return ResponseEntity.ok(Result.error("获取连接状态失败: " + e.getMessage()));
        }
    }

    /**
     * 启动用户的P2P连接
     * 
     * @param connectionId 连接ID
     * @return 操作结果
     */
    @PostMapping("/start/{connectionId}")
    @Operation(summary = "启动P2P连接", description = "启动当前用户的P2P edge进程")
    public ResponseEntity<Result<Void>> startConnection(
            @PathVariable String connectionId,
            @RequestAttribute("userId") Long currentUserId) {
        
        try {
            String password = signalingService.getConnectionPassword(connectionId);
            if (password == null) {
                return ResponseEntity.ok(Result.error("连接不存在或已过期"));
            }

            boolean started = p2pVpnService.startConnection(connectionId, currentUserId, password);
            
            if (started) {
                return ResponseEntity.ok(Result.success(null));
            } else {
                return ResponseEntity.ok(Result.error("启动P2P连接失败"));
            }
            
        } catch (Exception e) {
            log.error("启动P2P连接失败: connectionId={}, userId={}", 
                connectionId, currentUserId, e);
            return ResponseEntity.ok(Result.error("启动P2P连接失败: " + e.getMessage()));
        }
    }
}
