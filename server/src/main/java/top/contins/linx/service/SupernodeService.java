package top.contins.linx.service;

import org.springframework.stereotype.Service;
import top.contins.linx.model.dto.CreateSupernodeRequest;
import top.contins.linx.model.dto.UpdateSupernodeRequest;
import top.contins.linx.model.entity.Supernode;
import top.contins.linx.model.vo.SupernodeVO;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Supernode管理服务
 */
@Service
public class SupernodeService {
    
    // 模拟数据存储 (实际项目中应该使用数据库)
    private final Map<String, Supernode> supernodeStorage = new ConcurrentHashMap<>();
    
    public SupernodeService() {
        initDefaultSupernodes();
    }
    
    /**
     * 初始化默认的supernode列表
     */
    private void initDefaultSupernodes() {
        // 添加一些默认的supernode服务器
        createSupernode(createDefaultRequest("默认Supernode 1", "n2n1.ntop.org", 7777, "欧洲"));
        createSupernode(createDefaultRequest("默认Supernode 2", "n2n2.ntop.org", 7777, "北美"));
        createSupernode(createDefaultRequest("本地Supernode", "localhost", 7777, "本地"));
    }
    
    private CreateSupernodeRequest createDefaultRequest(String name, String host, int port, String location) {
        CreateSupernodeRequest request = new CreateSupernodeRequest();
        request.setName(name);
        request.setHost(host);
        request.setPort(port);
        request.setLocation(location);
        request.setDescription("系统默认Supernode服务器");
        request.setIsDefault(true);
        return request;
    }
    
    /**
     * 获取所有supernode列表
     */
    public List<SupernodeVO> getAllSupernodes() {
        return supernodeStorage.values().stream()
                .map(this::convertToVO)
                .sorted(Comparator.comparing(SupernodeVO::getCreateTime))
                .toList();
    }
    
    /**
     * 根据ID获取supernode
     */
    public SupernodeVO getSupernodeById(String id) {
        Supernode supernode = supernodeStorage.get(id);
        return supernode != null ? convertToVO(supernode) : null;
    }
    
    /**
     * 创建新的supernode
     */
    public SupernodeVO createSupernode(CreateSupernodeRequest request) {
        // 检查是否已存在相同的host:port组合
        boolean exists = supernodeStorage.values().stream()
                .anyMatch(s -> s.getHost().equals(request.getHost()) && s.getPort().equals(request.getPort()));
        
        if (exists) {
            throw new IllegalArgumentException("该地址的Supernode已存在: " + request.getHost() + ":" + request.getPort());
        }
        
        Supernode supernode = new Supernode();
        supernode.setId(UUID.randomUUID().toString());
        supernode.setName(request.getName());
        supernode.setHost(request.getHost());
        supernode.setPort(request.getPort());
        supernode.setLocation(request.getLocation());
        supernode.setDescription(request.getDescription());
        supernode.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : false);
        supernode.setCreateTime(LocalDateTime.now());
        supernode.setUpdateTime(LocalDateTime.now());
        
        supernodeStorage.put(supernode.getId(), supernode);
        
        return convertToVO(supernode);
    }
    
    /**
     * 更新supernode
     */
    public SupernodeVO updateSupernode(String id, UpdateSupernodeRequest request) {
        Supernode supernode = supernodeStorage.get(id);
        if (supernode == null) {
            throw new IllegalArgumentException("Supernode不存在: " + id);
        }
        
        // 检查host:port是否与其他supernode冲突
        if (request.getHost() != null && request.getPort() != null) {
            boolean conflicts = supernodeStorage.values().stream()
                    .anyMatch(s -> !s.getId().equals(id) && 
                             s.getHost().equals(request.getHost()) && 
                             s.getPort().equals(request.getPort()));
            
            if (conflicts) {
                throw new IllegalArgumentException("该地址的Supernode已存在: " + request.getHost() + ":" + request.getPort());
            }
        }
        
        // 更新字段
        if (request.getName() != null) {
            supernode.setName(request.getName());
        }
        if (request.getHost() != null) {
            supernode.setHost(request.getHost());
        }
        if (request.getPort() != null) {
            supernode.setPort(request.getPort());
        }
        if (request.getLocation() != null) {
            supernode.setLocation(request.getLocation());
        }
        if (request.getDescription() != null) {
            supernode.setDescription(request.getDescription());
        }
        if (request.getIsDefault() != null) {
            supernode.setIsDefault(request.getIsDefault());
        }
        
        supernode.setUpdateTime(LocalDateTime.now());
        
        return convertToVO(supernode);
    }
    
    /**
     * 删除supernode
     */
    public boolean deleteSupernode(String id) {
        Supernode removed = supernodeStorage.remove(id);
        return removed != null;
    }
    
    /**
     * 检测supernode连接状态
     */
    public SupernodeVO checkSupernodeStatus(String id) {
        Supernode supernode = supernodeStorage.get(id);
        if (supernode == null) {
            throw new IllegalArgumentException("Supernode不存在: " + id);
        }
        
        // 模拟连接检测 (实际项目中应该实现真实的网络检测)
        long startTime = System.currentTimeMillis();
        
        // 模拟网络延迟检测
        try {
            Thread.sleep(50 + (long)(Math.random() * 200)); // 模拟50-250ms延迟
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        long latency = System.currentTimeMillis() - startTime;
        
        // 随机设置状态 (实际应该基于真实连接结果)
        String[] statuses = {"ACTIVE", "INACTIVE", "TIMEOUT"};
        String status = statuses[(int)(Math.random() * statuses.length)];
        
        supernode.setStatus(status);
        supernode.setLatency(latency);
        supernode.setLastChecked(LocalDateTime.now());
        
        return convertToVO(supernode);
    }
    
    /**
     * 获取活跃的supernode列表
     */
    public List<SupernodeVO> getActiveSupernodes() {
        return supernodeStorage.values().stream()
                .filter(s -> "ACTIVE".equals(s.getStatus()))
                .map(this::convertToVO)
                .sorted(Comparator.comparing(SupernodeVO::getLatency, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }
    
    /**
     * 获取默认supernode列表
     */
    public List<SupernodeVO> getDefaultSupernodes() {
        return supernodeStorage.values().stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsDefault()))
                .map(this::convertToVO)
                .sorted(Comparator.comparing(SupernodeVO::getCreateTime))
                .toList();
    }
    
    /**
     * 将实体转换为VO
     */
    private SupernodeVO convertToVO(Supernode supernode) {
        SupernodeVO vo = new SupernodeVO();
        vo.setId(supernode.getId());
        vo.setName(supernode.getName());
        vo.setHost(supernode.getHost());
        vo.setPort(supernode.getPort());
        vo.setStatus(supernode.getStatus());
        vo.setLatency(supernode.getLatency());
        vo.setLocation(supernode.getLocation());
        vo.setDescription(supernode.getDescription());
        vo.setIsDefault(supernode.getIsDefault());
        vo.setLastChecked(supernode.getLastChecked());
        vo.setCreateTime(supernode.getCreateTime());
        vo.setFullAddress(supernode.getHost() + ":" + supernode.getPort());
        return vo;
    }
}