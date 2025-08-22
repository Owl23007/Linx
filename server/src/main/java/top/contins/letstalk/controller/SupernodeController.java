package top.contins.letstalk.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import top.contins.letstalk.model.dto.CreateSupernodeRequest;
import top.contins.letstalk.model.dto.UpdateSupernodeRequest;
import top.contins.letstalk.model.vo.ApiResponse;
import top.contins.letstalk.model.vo.SupernodeVO;
import top.contins.letstalk.service.SupernodeService;

import java.util.List;

/**
 * Supernode管理API控制器
 */
@RestController
@RequestMapping("/api/supernode")
@Tag(name = "Supernode管理", description = "n2n Supernode服务器管理相关API")
public class SupernodeController {
    
    @Autowired
    private SupernodeService supernodeService;
    
    @Operation(summary = "获取所有Supernode列表", description = "获取系统中所有已配置的Supernode服务器列表")
    @GetMapping
    public ApiResponse<List<SupernodeVO>> getAllSupernodes() {
        try {
            List<SupernodeVO> supernodes = supernodeService.getAllSupernodes();
            return ApiResponse.success("获取Supernode列表成功", supernodes);
        } catch (Exception e) {
            return ApiResponse.error("获取Supernode列表失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "根据ID获取Supernode详情", description = "根据指定ID获取Supernode服务器详细信息")
    @GetMapping("/{id}")
    public ApiResponse<SupernodeVO> getSupernodeById(
            @Parameter(description = "Supernode ID", required = true)
            @PathVariable String id) {
        try {
            SupernodeVO supernode = supernodeService.getSupernodeById(id);
            if (supernode == null) {
                return ApiResponse.error("Supernode不存在");
            }
            return ApiResponse.success("获取Supernode详情成功", supernode);
        } catch (Exception e) {
            return ApiResponse.error("获取Supernode详情失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "创建新的Supernode", description = "添加一个新的Supernode服务器到系统中")
    @PostMapping
    public ApiResponse<SupernodeVO> createSupernode(
            @Parameter(description = "创建Supernode请求体", required = true)
            @Valid @RequestBody CreateSupernodeRequest request) {
        try {
            SupernodeVO supernode = supernodeService.createSupernode(request);
            return ApiResponse.success("创建Supernode成功", supernode);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("创建Supernode失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("创建Supernode失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "更新Supernode信息", description = "更新指定ID的Supernode服务器信息")
    @PutMapping("/{id}")
    public ApiResponse<SupernodeVO> updateSupernode(
            @Parameter(description = "Supernode ID", required = true)
            @PathVariable String id,
            @Parameter(description = "更新Supernode请求体", required = true)
            @Valid @RequestBody UpdateSupernodeRequest request) {
        try {
            SupernodeVO supernode = supernodeService.updateSupernode(id, request);
            return ApiResponse.success("更新Supernode成功", supernode);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("更新Supernode失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("更新Supernode失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "删除Supernode", description = "从系统中删除指定ID的Supernode服务器")
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteSupernode(
            @Parameter(description = "Supernode ID", required = true)
            @PathVariable String id) {
        try {
            boolean deleted = supernodeService.deleteSupernode(id);
            if (!deleted) {
                return ApiResponse.error("Supernode不存在");
            }
            return ApiResponse.success("删除Supernode成功", "删除成功");
        } catch (Exception e) {
            return ApiResponse.error("删除Supernode失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "检测Supernode状态", description = "检测指定Supernode服务器的连接状态和延迟")
    @PostMapping("/{id}/check")
    public ApiResponse<SupernodeVO> checkSupernodeStatus(
            @Parameter(description = "Supernode ID", required = true)
            @PathVariable String id) {
        try {
            SupernodeVO supernode = supernodeService.checkSupernodeStatus(id);
            return ApiResponse.success("检测Supernode状态成功", supernode);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("检测Supernode状态失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("检测Supernode状态失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取活跃的Supernode列表", description = "获取当前状态为活跃的Supernode服务器列表，按延迟排序")
    @GetMapping("/active")
    public ApiResponse<List<SupernodeVO>> getActiveSupernodes() {
        try {
            List<SupernodeVO> supernodes = supernodeService.getActiveSupernodes();
            return ApiResponse.success("获取活跃Supernode列表成功", supernodes);
        } catch (Exception e) {
            return ApiResponse.error("获取活跃Supernode列表失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取默认Supernode列表", description = "获取系统默认的Supernode服务器列表")
    @GetMapping("/default")
    public ApiResponse<List<SupernodeVO>> getDefaultSupernodes() {
        try {
            List<SupernodeVO> supernodes = supernodeService.getDefaultSupernodes();
            return ApiResponse.success("获取默认Supernode列表成功", supernodes);
        } catch (Exception e) {
            return ApiResponse.error("获取默认Supernode列表失败: " + e.getMessage());
        }
    }
}