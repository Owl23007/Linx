<template>
  <div class="h-full bg-gray-50 flex flex-col">
    <!-- 搜索栏 -->
    <div class="flex items-center justify-between p-3 border-b border-gray-200 bg-white shadow-sm">
      <el-input v-model="search" placeholder="搜索" prefix-icon="Search" clearable size="small" class="w-full max-w-xs" />
      <div class="ml-2 flex gap-2">
        <el-button size="small" :icon="Refresh" circle @click="handleRefresh" :loading="isRefreshing" />
        <el-button type="primary" size="small" @click="handleAddClick">
          <el-icon>
            <Plus />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <el-icon class="is-loading text-blue-500" :size="32">
        <Loading />
      </el-icon>
      <span class="ml-2 text-gray-500">加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredChats.length === 0" class="flex-1 flex items-center justify-center">
      <el-empty description="暂无联系人">
        <el-button type="primary" @click="handleAddClick">添加好友/群组</el-button>
      </el-empty>
    </div>

    <!-- 聊天列表 -->
    <div v-else class="flex-1 overflow-y-auto px-2 py-2 space-y-2">
      <div v-for="(item, index) in filteredChats" :key="index"
        class="flex items-center p-3 rounded-lg hover:bg-white cursor-pointer transition-colors duration-150 shadow-sm"
        :class="{ 'bg-blue-50': item.selected }" @click="handleChatClick(item)">
        <!-- 头像 -->
        <el-avatar :src="item.avatar" :size="40" class="mr-3">
          {{ item.name[0] }}
        </el-avatar>

        <!-- 内容区 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-gray-800 truncate">{{ item.name }}</h3>
            <span v-if="item.time" class="text-xs text-gray-500">{{ item.time }}</span>
          </div>
          <p class="text-sm text-gray-600 truncate">{{ item.lastMessage }}</p>
        </div>

        <!-- 未读数 -->
        <div v-if="item.unread > 0"
          class="flex-shrink-0 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center ml-2">
          {{ item.unread > 99 ? '99+' : item.unread }}
        </div>

        <!-- 在线状态指示器（仅好友） -->
        <div v-if="item.type === 'private' && item.onlineStatus === 'ONLINE'"
          class="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full ml-2" title="在线">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFriendsStore } from '@/stores/friends';
import { useGroupsStore } from '@/stores/groups';
import { Loading, Plus, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, onMounted, ref } from 'vue';

// Emits
const emit = defineEmits<{
  (e: 'select-chat', chat: any): void;
}>();

// Stores
const friendsStore = useFriendsStore();
const groupsStore = useGroupsStore();

// State
const search = ref('');
const selectedChatId = ref<string | null>(null);
const loading = ref(false);
const isRefreshing = ref(false);

// Computed
const chats = computed(() => {
  const result: any[] = [];

  // 添加好友会话
  friendsStore.acceptedFriends.forEach(friend => {
    result.push({
      id: `private_${friend.friendId}`,
      type: 'private',
      friendId: friend.friendId,
      friendUsername: friend.friendUsername,
      remark: friend.remark,
      friendAvatar: friend.friendAvatar,
      onlineStatus: friend.onlineStatus,
      name: friend.remark || friend.friendUsername,
      avatar: friend.friendAvatar,
      lastMessage: '点击开始聊天...',
      time: '',
      unread: 0,
      selected: selectedChatId.value === `private_${friend.friendId}`,
    });
  });

  // 添加群组会话
  groupsStore.activeGroups.forEach(group => {
    result.push({
      ...group,
      id: `group_${group.id}`,
      type: 'group',
      name: group.name,
      avatar: group.avatarUrl,
      lastMessage: '点击开始聊天...',
      time: '',
      unread: 0,
      selected: selectedChatId.value === `group_${group.id}`,
    });
  });

  return result;
});

const filteredChats = computed(() => {
  const searchLower = search.value.toLowerCase();
  if (!searchLower) return chats.value;

  return chats.value.filter(chat =>
    chat.name.toLowerCase().includes(searchLower) ||
    chat.lastMessage.toLowerCase().includes(searchLower)
  );
});

// Methods
function handleChatClick(chat: any) {
  selectedChatId.value = chat.id;
  emit('select-chat', chat);
}

function handleAddClick() {
  ElMessage.info('添加好友/群组功能开发中...');
  // TODO: 打开添加好友/群组对话框
}

async function handleRefresh() {
  isRefreshing.value = true;
  try {
    await Promise.all([
      friendsStore.loadFriends(),
      groupsStore.loadGroups(),
    ]);
    ElMessage.success('刷新成功');
  } catch {
    ElMessage.error('刷新失败');
  } finally {
    isRefreshing.value = false;
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      friendsStore.loadFriends(),
      groupsStore.loadGroups(),
    ]);
  } catch {
    ElMessage.error('加载联系人列表失败');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* 自定义样式 */
.el-input {
  --el-input-border-color-hover: #409eff;
  --el-input-border-color-focus: #409eff;
}
</style>
