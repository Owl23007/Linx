package top.contins.linx.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import top.contins.linx.config.N2NProperties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * P2PVpnService单元测试
 */
@ExtendWith(MockitoExtension.class)
class P2PVpnServiceTest {

    @Mock
    private N2NProcessManager n2nProcessManager;

    @Mock
    private N2NProperties n2nProperties;

    @InjectMocks
    private P2PVpnService p2pVpnService;

    @BeforeEach
    void setUp() {
        lenient().when(n2nProperties.getCommunityPrefix()).thenReturn("linx");
        lenient().when(n2nProperties.getSupernodeAddress()).thenReturn("127.0.0.1:7777");
    }

    @Test
    void testCreateConnection_Success() {
        Long userId1 = 1L;
        Long userId2 = 2L;

        P2PVpnService.P2PConnectionInfo result = p2pVpnService.createConnection(userId1, userId2);

        assertNotNull(result);
        assertNotNull(result.connectionId);
        assertNotNull(result.community);
        assertEquals(userId1, result.userId1);
        assertEquals(userId2, result.userId2);
        assertNotNull(result.virtualIp1);
        assertNotNull(result.virtualIp2);
        assertFalse(result.user1Connected);
        assertFalse(result.user2Connected);
    }

    @Test
    void testCreateConnection_SameUser() {
        Long userId = 1L;

        assertThrows(IllegalArgumentException.class, () -> {
            p2pVpnService.createConnection(userId, userId);
        });
    }

    @Test
    void testCreateConnection_NullUsers() {
        assertThrows(IllegalArgumentException.class, () -> {
            p2pVpnService.createConnection(null, 1L);
        });

        assertThrows(IllegalArgumentException.class, () -> {
            p2pVpnService.createConnection(1L, null);
        });
    }

    @Test
    void testStartConnection_Success() {
        Long userId1 = 1L;
        Long userId2 = 2L;
        P2PVpnService.P2PConnectionInfo connection = p2pVpnService.createConnection(userId1, userId2);
        
        when(n2nProcessManager.startEdge(
                anyString(), 
                anyString(), 
                anyString(), 
                anyString(), 
                anyString()
        )).thenReturn(true);

        boolean result = p2pVpnService.startConnection(
                connection.connectionId, 
                userId1, 
                "test-password"
        );

        assertTrue(result);
        assertTrue(connection.user1Connected);
        verify(n2nProcessManager, times(1)).startEdge(
                anyString(), 
                anyString(), 
                anyString(), 
                anyString(), 
                anyString()
        );
    }

    @Test
    void testStopConnection() {
        Long userId1 = 1L;
        Long userId2 = 2L;
        P2PVpnService.P2PConnectionInfo connection = p2pVpnService.createConnection(userId1, userId2);

        p2pVpnService.stopConnection(connection.connectionId);

        verify(n2nProcessManager, times(2)).stopEdge(anyString());
        assertNull(p2pVpnService.getConnectionInfo(connection.connectionId));
    }

    @Test
    void testGetConnectionInfo() {
        Long userId1 = 1L;
        Long userId2 = 2L;
        P2PVpnService.P2PConnectionInfo connection = p2pVpnService.createConnection(userId1, userId2);

        P2PVpnService.P2PConnectionInfo retrieved = p2pVpnService.getConnectionInfo(connection.connectionId);

        assertNotNull(retrieved);
        assertEquals(connection.connectionId, retrieved.connectionId);
        assertEquals(connection.community, retrieved.community);
    }

    @Test
    void testIsConnectionActive() {
        Long userId1 = 1L;
        Long userId2 = 2L;
        P2PVpnService.P2PConnectionInfo connection = p2pVpnService.createConnection(userId1, userId2);

        when(n2nProcessManager.isProcessRunning(anyString())).thenReturn(true);

        boolean result = p2pVpnService.isConnectionActive(connection.connectionId);

        assertTrue(result);
        verify(n2nProcessManager, times(2)).isProcessRunning(anyString());
    }
}
