<template>
  <div class="friend-requests-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span>好友请求</span>
        <el-badge v-if="unreadCount > 0" :value="unreadCount" class="badge" />
      </div>
    </div>

    <div class="requests-list">
      <!-- 收到的请求 -->
      <div v-if="receivedRequests.length > 0" class="requests-section">
        <div class="section-title">收到的请求</div>
        <div v-for="request in receivedRequests" :key="request.friendshipId" class="request-item">
          <el-avatar :size="50" class="request-avatar">
            {{ request.friendUsername[0] }}
          </el-avatar>

          <div class="request-info">
            <div class="request-name">{{ request.remark || request.friendUsername }}</div>
            <div class="request-message">请求添加您为好友</div>
            <div class="request-time">{{ request.createdAt ? formatTime(request.createdAt) : '' }}</div>
          </div>

          <div class="request-actions">
            <el-button v-if="request.status === 'PENDING'" type="success" size="small"
              :loading="loadingMap[request.friendshipId]" @click="handleAccept(request.friendshipId)">
              接受
            </el-button>
            <el-button v-if="request.status === 'PENDING'" type="danger" size="small"
              :loading="loadingMap[request.friendshipId]" @click="handleReject(request.friendshipId)">
              拒绝
            </el-button>
            <el-tag v-if="request.status === 'ACCEPTED'" type="success" size="small">
              已接受
            </el-tag>
            <el-tag v-if="request.status === 'REJECTED'" type="info" size="small">
              已拒绝
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 发出的请求 -->
      <div v-if="sentRequests.length > 0" class="requests-section">
        <div class="section-title">发出的请求</div>
        <div v-for="request in sentRequests" :key="request.friendshipId" class="request-item">
          <el-avatar :size="50" class="request-avatar">
            {{ request.friendUsername[0] }}
          </el-avatar>

          <div class="request-info">
            <div class="request-name">{{ request.remark || request.friendUsername }}</div>
            <div class="request-message">等待对方同意</div>
            <div class="request-time">{{ request.createdAt ? formatTime(request.createdAt) : '' }}</div>
          </div>

          <div class="request-status">
            <el-tag v-if="request.status === 'PENDING'" type="warning" size="small">
              等待确认
            </el-tag>
            <el-tag v-if="request.status === 'ACCEPTED'" type="success" size="small">
              已接受
            </el-tag>
            <el-tag v-if="request.status === 'REJECTED'" type="danger" size="small">
              已拒绝
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="receivedRequests.length === 0 && sentRequests.length === 0" class="empty-state">
        <el-empty description="暂无好友请求" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFriendsStore } from '@/stores/friends';
import { formatRelativeTime } from '@/utils/datetime';
import { ElMessage } from 'element-plus';
import { computed, onMounted, reactive } from 'vue';

// Store
const friendsStore = useFriendsStore();

// Refs
const loadingMap = reactive<Record<number, boolean>>({});

// Computed
const receivedRequests = computed(() => friendsStore.receivedRequests);
const sentRequests = computed(() => friendsStore.sentRequests);
const unreadCount = computed(() =>
  receivedRequests.value.filter(r => r.status === 'PENDING').length
);

// Methods
function formatTime(timestamp: string) {
  return formatRelativeTime(timestamp);
}

async function handleAccept(requestId: number) {
  loadingMap[requestId] = true;
  try {
    const success = await friendsStore.handleFriendRequest(requestId, true);
    if (success) {
      ElMessage.success('已接受好友请求');
    }
  } finally {
    loadingMap[requestId] = false;
  }
}

async function handleReject(requestId: number) {
  loadingMap[requestId] = true;
  try {
    const success = await friendsStore.handleFriendRequest(requestId, false);
    if (success) {
      ElMessage.info('已拒绝好友请求');
    }
  } finally {
    loadingMap[requestId] = false;
  }
}

// Lifecycle
onMounted(() => {
  friendsStore.loadFriends();
});
</script>

<style scoped lang="less">
.friend-requests-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.panel-header {
  padding: 15px 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;

  .panel-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 500;
    color: #333;

    .badge {
      :deep(.el-badge__content) {
        background-color: #f56c6c;
      }
    }
  }
}

.requests-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.requests-section {
  margin-bottom: 30px;

  &:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: 14px;
    font-weight: 500;
    color: #666;
    margin-bottom: 15px;
    padding-left: 5px;
  }
}

.request-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  .request-avatar {
    flex-shrink: 0;
  }

  .request-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;

    .request-name {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }

    .request-message {
      font-size: 14px;
      color: #666;
    }

    .request-time {
      font-size: 12px;
      color: #999;
    }
  }

  .request-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .request-status {
    flex-shrink: 0;
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}
</style>
