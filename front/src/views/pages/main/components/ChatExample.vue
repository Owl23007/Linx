<!-- 在主界面集成好友、群组、聊天功能的示例 -->

<template>
  <div class="main-page">
    <el-container class="main-container">
      <!-- 左侧边栏 -->
      <el-aside width="300px" class="sidebar">
        <el-tabs v-model="activeTab" class="sidebar-tabs">
          <!-- 好友列表 -->
          <el-tab-pane label="好友" name="friends">
            <div class="tab-header">
              <el-input v-model="friendSearch" placeholder="搜索好友" clearable prefix-icon="Search" />
              <el-button type="primary" @click="showAddFriendDialog = true">
                <el-icon>
                  <Plus />
                </el-icon>
                添加好友
              </el-button>
            </div>

            <div class="friends-list">
              <div v-for="friend in filteredFriends" :key="friend.friendId"
                :class="['friend-item', { active: currentChatUser?.friendId === friend.friendId }]"
                @click="openPrivateChat(friend)">
                <el-badge :is-dot="hasUnread(friend.friendId)" class="avatar-badge">
                  <el-avatar :size="40">
                    {{ (friend.remark || friend.friendUsername)[0] }}
                  </el-avatar>
                </el-badge>
                <div class="friend-info">
                  <div class="friend-name">{{ friend.remark || friend.friendUsername }}</div>
                  <div class="friend-status">{{ friend.onlineStatus || 'OFFLINE' }}</div>
                </div>
              </div>
            </div>

            <div class="tab-footer">
              <el-button text @click="showFriendRequestsDialog = true">
                <el-badge :value="pendingRequestsCount" :hidden="pendingRequestsCount === 0">
                  好友请求
                </el-badge>
              </el-button>
            </div>
          </el-tab-pane>

          <!-- 群组列表 -->
          <el-tab-pane label="群组" name="groups">
            <div class="tab-header">
              <el-input v-model="groupSearch" placeholder="搜索群组" clearable prefix-icon="Search" />
              <el-button type="primary" @click="showCreateGroupDialog = true">
                <el-icon>
                  <Plus />
                </el-icon>
                创建群组
              </el-button>
            </div>

            <div class="groups-list">
              <div v-for="group in filteredGroups" :key="group.id"
                :class="['group-item', { active: currentChatGroup?.id === group.id }]" @click="openGroupChat(group)">
                <el-badge :is-dot="hasUnreadGroup(group.id)" class="avatar-badge">
                  <el-avatar :size="40">
                    {{ group.name[0] }}
                  </el-avatar>
                </el-badge>
                <div class="group-info">
                  <div class="group-name">{{ group.name }}</div>
                  <div class="group-members">{{ group.memberCount || 0 }} 成员</div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-aside>

      <!-- 聊天区域 -->
      <el-main class="chat-area">
        <ChatWindow v-if="currentChat" :conversation-id="currentChat.conversationId"
          :conversation-type="currentChat.type" :chat-name="currentChat.name" :receiver-id="currentChat.receiverId"
          :group-id="currentChat.groupId" @send="handleSendMessage" @more="handleShowChatInfo" />
        <el-empty v-else description="选择一个会话开始聊天" />
      </el-main>
    </el-container>

    <!-- 添加好友对话框 -->
    <AddFriendDialog v-model:visible="showAddFriendDialog" @success="handleAddFriendSuccess" />

    <!-- 好友请求列表对话框 -->
    <el-dialog v-model="showFriendRequestsDialog" title="好友请求" width="600px" :destroy-on-close="true">
      <FriendRequestsList />
    </el-dialog>

    <!-- 创建群组对话框 -->
    <CreateGroupDialog v-model:visible="showCreateGroupDialog" @success="handleCreateGroupSuccess" />
  </div>
</template>

<script setup lang="ts">
import { useWebSocket } from '@/composables/useWebSocket';
import { useChatStore } from '@/stores/chat';
import { useFriendsStore } from '@/stores/friends';
import { useGroupsStore } from '@/stores/groups';
import type { FriendVO } from '@/types/friend';
import type { GroupVO } from '@/types/group';
import AddFriendDialog from '@/views/components/AddFriendDialog.vue';
import ChatWindow from '@/views/components/ChatWindow.vue';
import CreateGroupDialog from '@/views/components/CreateGroupDialog.vue';
import FriendRequestsList from '@/views/components/FriendRequestsList.vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, onMounted, ref } from 'vue';

// Stores
const friendsStore = useFriendsStore();
const groupsStore = useGroupsStore();
const chatStore = useChatStore();

// WebSocket
const { connect, sendPrivateMessage, sendGroupMessage } = useWebSocket();

// Refs
const activeTab = ref('friends');
const friendSearch = ref('');
const groupSearch = ref('');
const showAddFriendDialog = ref(false);
const showFriendRequestsDialog = ref(false);
const showCreateGroupDialog = ref(false);

// 当前聊天信息
interface ChatInfo {
  conversationId: string;
  type: 'private' | 'group';
  name: string;
  receiverId?: number;
  groupId?: string;
}

const currentChat = ref<ChatInfo | null>(null);
const currentChatUser = ref<FriendVO | null>(null);
const currentChatGroup = ref<GroupVO | null>(null);

// Computed
const filteredFriends = computed(() => {
  const search = friendSearch.value.toLowerCase();

  return friendsStore.acceptedFriends.filter(f =>
    (f.remark || f.friendUsername).toLowerCase().includes(search)
  );
});

const filteredGroups = computed(() => {
  const search = groupSearch.value.toLowerCase();

  return groupsStore.groups.filter(g =>
    g.name.toLowerCase().includes(search)
  );
});

const pendingRequestsCount = computed(() => friendsStore.pendingRequestsCount);

// Methods
function hasUnread(userId: number) {
  return (chatStore.unreadCounts.get(`private_${userId}`) || 0) > 0;
}

function hasUnreadGroup(groupId: number) {
  return (chatStore.unreadCounts.get(`group_${groupId}`) || 0) > 0;
}

function openPrivateChat(friend: FriendVO) {
  currentChatUser.value = friend;
  currentChatGroup.value = null;
  currentChat.value = {
    conversationId: `private_${friend.friendId}`,
    type: 'private',
    name: friend.remark || friend.friendUsername,
    receiverId: friend.friendId,
  };

  // 标记已读
  chatStore.markConversationAsRead(`private_${friend.friendId}`);
}

function openGroupChat(group: GroupVO) {
  currentChatGroup.value = group;
  currentChatUser.value = null;
  currentChat.value = {
    conversationId: `group_${group.id}`,
    type: 'group',
    name: group.name,
    groupId: String(group.id),
  };

  // 标记已读
  chatStore.markConversationAsRead(`group_${group.id}`);
}

async function handleSendMessage(content: string) {
  if (!currentChat.value) return;

  if (currentChat.value.type === 'private' && currentChat.value.receiverId) {
    await sendPrivateMessage(currentChat.value.receiverId, content);
    ElMessage.success('消息已发送');
  } else if (currentChat.value.type === 'group' && currentChat.value.groupId) {
    await sendGroupMessage(currentChat.value.groupId, content);
    ElMessage.success('消息已发送');
  }
}

function handleShowChatInfo() {
  ElMessage.info('聊天信息功能开发中...');
}

function handleAddFriendSuccess() {
  ElMessage.success('好友请求已发送');
  friendsStore.loadFriends();
}

function handleCreateGroupSuccess(groupId: number) {
  ElMessage.success('群组创建成功');
  groupsStore.loadGroups();

  // 自动打开新创建的群组聊天
  const group = groupsStore.groups.find(g => g.id === groupId);
  if (group) {
    openGroupChat(group);
  }
}

// Lifecycle
onMounted(async () => {
  // 加载好友和群组列表
  await Promise.all([
    friendsStore.loadFriends(),
    groupsStore.loadGroups(),
  ]);

  // 准备 WebSocket 连接
  await chatStore.prepareWebSocket();

  // 连接 WebSocket
  if (chatStore.wsTicket) {
    connect(chatStore.wsTicket);
  }
});
</script>

<style scoped lang="less">
.main-page {
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
}

.main-container {
  height: 100%;
}

.sidebar {
  background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;

  .sidebar-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;

    :deep(.el-tabs__content) {
      flex: 1;
      overflow: hidden;
    }

    :deep(.el-tab-pane) {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
  }
}

.tab-header {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;

  .el-input {
    margin-bottom: 10px;
  }

  .el-button {
    width: 100%;
  }
}

.tab-footer {
  padding: 10px 15px;
  border-top: 1px solid #f0f0f0;

  .el-button {
    width: 100%;
  }
}

.friends-list,
.groups-list {
  flex: 1;
  overflow-y: auto;
}

.friend-item,
.group-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background: #f5f5f5;
  }

  &.active {
    background: #e6f7ff;
  }

  .avatar-badge {
    margin-right: 12px;
  }
}

.friend-info,
.group-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .friend-name,
  .group-name {
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }

  .friend-status,
  .group-members {
    font-size: 12px;
    color: #999;
  }
}

.chat-area {
  padding: 0;
  display: flex;
  flex-direction: column;
}
</style>
