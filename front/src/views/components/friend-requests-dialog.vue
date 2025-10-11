<template>
  <el-dialog v-model="dialogVisible" title="好友请求" width="600px" @close="handleClose">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 收到的请求 -->
      <el-tab-pane label="收到的请求" name="received">
        <div v-if="loading" class="flex justify-center py-8">
          <el-icon class="is-loading text-blue-500">
            <Loading />
          </el-icon>
          <span class="ml-2 text-sm text-gray-500">加载中...</span>
        </div>

        <div v-else-if="receivedRequests.length === 0" class="flex justify-center py-8">
          <el-empty description="暂无好友请求" />
        </div>

        <div v-else class="space-y-3">
          <div v-for="request in receivedRequests" :key="request.friendshipId"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center space-x-3">
              <el-avatar :size="48" :src="request.friendAvatar">
                {{ request.friendUsername[0]?.toUpperCase() }}
              </el-avatar>
              <div>
                <div class="font-medium text-gray-800">{{ request.friendUsername }}</div>
                <div v-if="request.friendNickname" class="text-sm text-gray-500">
                  {{ request.friendNickname }}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  {{ formatTime(request.createdAt) }}
                </div>
              </div>
            </div>

            <div class="flex space-x-2">
              <el-button type="primary" size="small" :loading="processing === request.friendshipId"
                @click="handleAccept(request.friendshipId)">
                接受
              </el-button>
              <el-button size="small" :loading="processing === request.friendshipId"
                @click="handleReject(request.friendshipId)">
                拒绝
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 发送的请求 -->
      <el-tab-pane label="发送的请求" name="sent">
        <div v-if="loading" class="flex justify-center py-8">
          <el-icon class="is-loading text-blue-500">
            <Loading />
          </el-icon>
          <span class="ml-2 text-sm text-gray-500">加载中...</span>
        </div>

        <div v-else-if="sentRequests.length === 0" class="flex justify-center py-8">
          <el-empty description="暂无发送的请求" />
        </div>

        <div v-else class="space-y-3">
          <div v-for="request in sentRequests" :key="request.friendshipId"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <el-avatar :size="48" :src="request.friendAvatar">
                {{ request.friendUsername[0]?.toUpperCase() }}
              </el-avatar>
              <div>
                <div class="font-medium text-gray-800">{{ request.friendUsername }}</div>
                <div v-if="request.friendNickname" class="text-sm text-gray-500">
                  {{ request.friendNickname }}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  {{ formatTime(request.createdAt) }}
                </div>
              </div>
            </div>

            <el-tag :type="getStatusType(request.status)" size="small">
              {{ getStatusText(request.status) }}
            </el-tag>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup lang="ts">
import { useFriendsStore } from '@/stores/friends';
import { Loading } from '@element-plus/icons-vue';
import { computed, ref, watch } from 'vue';

// Props & Emits
const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

// Store
const friendsStore = useFriendsStore();

// Refs
const dialogVisible = ref(props.visible);
const activeTab = ref<'received' | 'sent'>('received');
const loading = ref(false);
const processing = ref<number | null>(null);

// Computed
const receivedRequests = computed(() => friendsStore.receivedRequests);
const sentRequests = computed(() => friendsStore.sentRequests);

// Watch props
watch(() => props.visible, async (val) => {
  dialogVisible.value = val;
  if (val) {
    await loadData();
  }
});

watch(dialogVisible, (val) => {
  emit('update:visible', val);
});

// Methods
async function loadData() {
  loading.value = true;
  try {
    if (activeTab.value === 'received') {
      await friendsStore.loadReceivedRequests();
    } else {
      await friendsStore.loadSentRequests();
    }
  } finally {
    loading.value = false;
  }
}

async function handleTabChange() {
  await loadData();
}

async function handleAccept(friendshipId: number) {
  processing.value = friendshipId;
  try {
    const success = await friendsStore.handleFriendRequest(friendshipId, true);
    if (success) {
      // 重新加载请求列表
      await loadData();
    }
  } finally {
    processing.value = null;
  }
}

async function handleReject(friendshipId: number) {
  processing.value = friendshipId;
  try {
    const success = await friendsStore.handleFriendRequest(friendshipId, false);
    if (success) {
      // 重新加载请求列表
      await loadData();
    }
  } finally {
    processing.value = null;
  }
}

function handleClose() {
  dialogVisible.value = false;
}

function formatTime(dateString?: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: '等待中',
    ACCEPTED: '已接受',
    REJECTED: '已拒绝',
    BLOCKED: '已屏蔽',
  };

  return statusMap[status] || status;
}

function getStatusType(status: string): 'success' | 'info' | 'warning' | 'danger' {
  const typeMap: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    PENDING: 'warning',
    ACCEPTED: 'success',
    REJECTED: 'info',
    BLOCKED: 'danger',
  };

  return typeMap[status] || 'info';
}
</script>

<style scoped lang="less">
.el-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}
</style>
