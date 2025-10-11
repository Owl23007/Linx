<template>
  <div class="h-full bg-gray-50 flex flex-col">
    <!-- 搜索栏 -->
    <div class="flex items-center justify-between p-3 border-b border-gray-200 bg-white shadow-sm">
      <el-input v-model="search" placeholder="搜索" prefix-icon="Search" clearable size="small" class="w-full max-w-xs" />
      <el-button type="primary" size="small" @click="handleAddClick" class="ml-2">
        <el-icon>
          <Plus />
        </el-icon>
      </el-button>
    </div>

    <!-- 聊天列表 -->
    <div class="flex-1 overflow-y-auto px-2 py-2 space-y-2">
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
            <span class="text-xs text-gray-500">{{ item.time }}</span>
          </div>
          <p class="text-sm text-gray-600 truncate">{{ item.lastMessage }}</p>
        </div>

        <!-- 未读数 -->
        <div v-if="item.unread > 0"
          class="flex-shrink-0 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {{ item.unread > 99 ? '99+' : item.unread }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFriendsStore } from '@/stores/friends';
import { useGroupsStore } from '@/stores/groups';
import { Plus } from '@element-plus/icons-vue';
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
  // TODO: 显示添加好友或创建群组的菜单
}

// Lifecycle
onMounted(() => {
  friendsStore.loadFriends();
  groupsStore.loadGroups();
});
</script>

<style scoped>
/* 自定义样式 */
.el-input {
  --el-input-border-color-hover: #409eff;
  --el-input-border-color-focus: #409eff;
}
</style>
