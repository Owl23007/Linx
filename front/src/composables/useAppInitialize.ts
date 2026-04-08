import { useChatStore } from '@/stores/chat';
import { useFriendsStore } from '@/stores/friends';
import { useGroupsStore } from '@/stores/groups';
import { useRoomStore } from '@/stores/room';
import { useUserStore } from '@/stores/user';
import { onMounted } from 'vue';

/**
 * 应用初始化 Hook
 * 在主应用加载时调用，初始化所有必要的数据
 */
export function useAppInitialize() {
  const userStore = useUserStore();
  const friendsStore = useFriendsStore();
  const groupsStore = useGroupsStore();
  const roomStore = useRoomStore();
  const chatStore = useChatStore();

  /**
   * 初始化所有数据
   */
  async function initialize() {
    try {
      // 1. 加载当前用户信息
      await userStore.loadCurrentUser();

      // 2. 并行加载其他数据
      await Promise.all([
        friendsStore.initialize(),
        groupsStore.initialize(),
        roomStore.initialize(),
        chatStore.initialize(),
      ]);
    } catch {
      // 初始化失败
    }
  }

  /**
   * 清理所有数据
   */
  function cleanup() {
    userStore.reset();
    friendsStore.reset();
    groupsStore.reset();
    roomStore.reset();
    chatStore.reset();
  }

  // 自动初始化
  onMounted(() => {
    void initialize();
  });

  return {
    initialize,
    cleanup,
  };
}
