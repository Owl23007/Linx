import { createPinia } from 'pinia';

// 创建 Pinia 实例
export const pinia = createPinia();

export default pinia;

// 导出所有 store
export { useAuthStore } from './auth';
export { useChatStore } from './chat';
export { useFriendsStore } from './friends';
export { useGlobalStore } from './global';
export { useGroupsStore } from './groups';
export { useRoomStore } from './room';
export { useUserStore } from './user';
