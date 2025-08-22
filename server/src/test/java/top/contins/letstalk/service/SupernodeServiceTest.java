package top.contins.letstalk.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import top.contins.letstalk.model.dto.CreateSupernodeRequest;
import top.contins.letstalk.model.dto.UpdateSupernodeRequest;
import top.contins.letstalk.model.vo.SupernodeVO;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SupernodeService 单元测试
 */
@SpringBootTest
class SupernodeServiceTest {
    
    private SupernodeService supernodeService;
    
    @BeforeEach
    void setUp() {
        supernodeService = new SupernodeService();
    }
    
    @Test
    void testGetAllSupernodes() {
        List<SupernodeVO> supernodes = supernodeService.getAllSupernodes();
        assertNotNull(supernodes);
        // 默认应该有3个预设的supernode
        assertEquals(3, supernodes.size());
        
        // 验证默认supernode存在
        assertTrue(supernodes.stream().anyMatch(s -> "默认Supernode 1".equals(s.getName())));
        assertTrue(supernodes.stream().anyMatch(s -> "默认Supernode 2".equals(s.getName())));
        assertTrue(supernodes.stream().anyMatch(s -> "本地Supernode".equals(s.getName())));
    }
    
    @Test
    void testCreateSupernode() {
        CreateSupernodeRequest request = new CreateSupernodeRequest();
        request.setName("测试Supernode");
        request.setHost("test.example.com");
        request.setPort(9999);
        request.setLocation("测试地区");
        request.setDescription("这是一个测试Supernode");
        request.setIsDefault(false);
        
        SupernodeVO created = supernodeService.createSupernode(request);
        
        assertNotNull(created);
        assertNotNull(created.getId());
        assertEquals("测试Supernode", created.getName());
        assertEquals("test.example.com", created.getHost());
        assertEquals(9999, created.getPort());
        assertEquals("测试地区", created.getLocation());
        assertEquals("这是一个测试Supernode", created.getDescription());
        assertEquals(false, created.getIsDefault());
        assertEquals("UNKNOWN", created.getStatus());
        assertEquals("test.example.com:9999", created.getFullAddress());
        assertNotNull(created.getCreateTime());
    }
    
    @Test
    void testCreateDuplicateSupernode() {
        CreateSupernodeRequest request = new CreateSupernodeRequest();
        request.setName("重复测试");
        request.setHost("duplicate.example.com");
        request.setPort(8888);
        
        // 第一次创建应该成功
        SupernodeVO first = supernodeService.createSupernode(request);
        assertNotNull(first);
        
        // 第二次创建相同的host:port应该失败
        assertThrows(IllegalArgumentException.class, () -> {
            supernodeService.createSupernode(request);
        });
    }
    
    @Test
    void testGetSupernodeById() {
        // 先创建一个supernode
        CreateSupernodeRequest request = new CreateSupernodeRequest();
        request.setName("ID测试");
        request.setHost("id.test.com");
        request.setPort(7777);
        
        SupernodeVO created = supernodeService.createSupernode(request);
        String id = created.getId();
        
        // 通过ID获取
        SupernodeVO found = supernodeService.getSupernodeById(id);
        assertNotNull(found);
        assertEquals(created.getId(), found.getId());
        assertEquals(created.getName(), found.getName());
        assertEquals(created.getHost(), found.getHost());
        assertEquals(created.getPort(), found.getPort());
        
        // 不存在的ID应该返回null
        SupernodeVO notFound = supernodeService.getSupernodeById("non-existing-id");
        assertNull(notFound);
    }
    
    @Test
    void testUpdateSupernode() {
        // 先创建一个supernode
        CreateSupernodeRequest createRequest = new CreateSupernodeRequest();
        createRequest.setName("更新测试");
        createRequest.setHost("update.test.com");
        createRequest.setPort(7777);
        
        SupernodeVO created = supernodeService.createSupernode(createRequest);
        String id = created.getId();
        
        // 更新信息
        UpdateSupernodeRequest updateRequest = new UpdateSupernodeRequest();
        updateRequest.setName("更新后的名称");
        updateRequest.setLocation("新地区");
        updateRequest.setDescription("更新后的描述");
        
        SupernodeVO updated = supernodeService.updateSupernode(id, updateRequest);
        
        assertNotNull(updated);
        assertEquals("更新后的名称", updated.getName());
        assertEquals("新地区", updated.getLocation());
        assertEquals("更新后的描述", updated.getDescription());
        // 未更新的字段应该保持原值
        assertEquals(created.getHost(), updated.getHost());
        assertEquals(created.getPort(), updated.getPort());
    }
    
    @Test
    void testUpdateNonExistentSupernode() {
        UpdateSupernodeRequest request = new UpdateSupernodeRequest();
        request.setName("不存在的更新");
        
        assertThrows(IllegalArgumentException.class, () -> {
            supernodeService.updateSupernode("non-existing-id", request);
        });
    }
    
    @Test
    void testDeleteSupernode() {
        // 先创建一个supernode
        CreateSupernodeRequest request = new CreateSupernodeRequest();
        request.setName("删除测试");
        request.setHost("delete.test.com");
        request.setPort(7777);
        
        SupernodeVO created = supernodeService.createSupernode(request);
        String id = created.getId();
        
        // 删除
        boolean deleted = supernodeService.deleteSupernode(id);
        assertTrue(deleted);
        
        // 验证已删除
        SupernodeVO notFound = supernodeService.getSupernodeById(id);
        assertNull(notFound);
        
        // 删除不存在的ID应该返回false
        boolean notDeleted = supernodeService.deleteSupernode("non-existing-id");
        assertFalse(notDeleted);
    }
    
    @Test
    void testCheckSupernodeStatus() {
        // 先创建一个supernode
        CreateSupernodeRequest request = new CreateSupernodeRequest();
        request.setName("状态测试");
        request.setHost("status.test.com");
        request.setPort(7777);
        
        SupernodeVO created = supernodeService.createSupernode(request);
        String id = created.getId();
        
        // 检查状态
        SupernodeVO checked = supernodeService.checkSupernodeStatus(id);
        
        assertNotNull(checked);
        assertNotNull(checked.getStatus());
        assertNotNull(checked.getLatency());
        assertNotNull(checked.getLastChecked());
        // 状态应该是有效值之一
        assertTrue(List.of("ACTIVE", "INACTIVE", "TIMEOUT").contains(checked.getStatus()));
    }
    
    @Test
    void testGetDefaultSupernodes() {
        List<SupernodeVO> defaults = supernodeService.getDefaultSupernodes();
        assertNotNull(defaults);
        assertEquals(3, defaults.size()); // 默认有3个default supernode
        
        // 所有返回的都应该是默认的
        for (SupernodeVO supernode : defaults) {
            assertTrue(supernode.getIsDefault());
        }
    }
    
    @Test
    void testGetActiveSupernodes() {
        // 初始时没有ACTIVE状态的supernode
        List<SupernodeVO> actives = supernodeService.getActiveSupernodes();
        assertNotNull(actives);
        assertEquals(0, actives.size());
        
        // 创建一个并设置为ACTIVE状态
        CreateSupernodeRequest request = new CreateSupernodeRequest();
        request.setName("活跃测试");
        request.setHost("active.test.com");
        request.setPort(7777);
        
        SupernodeVO created = supernodeService.createSupernode(request);
        
        // 多次检查状态直到获得ACTIVE状态 (由于是随机的，可能需要多次尝试)
        boolean foundActive = false;
        for (int i = 0; i < 10 && !foundActive; i++) {
            SupernodeVO checked = supernodeService.checkSupernodeStatus(created.getId());
            if ("ACTIVE".equals(checked.getStatus())) {
                foundActive = true;
                actives = supernodeService.getActiveSupernodes();
                assertTrue(actives.size() >= 1);
                assertTrue(actives.stream().anyMatch(s -> s.getId().equals(created.getId())));
            }
        }
        
        // 注意：由于状态检查是随机的，这个测试可能不是100%可靠，
        // 但在实际项目中应该实现真实的网络检测
    }
}