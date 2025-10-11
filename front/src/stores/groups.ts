import linxApi from '@/services/linxApiService';
import type { GroupMemberVO, GroupVO } from '@/types/group';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * 群组管理 Store
 */
export const useGroupsStore = defineStore('groups', () => {
  // ==================== 状态 ====================
  const groups = ref<GroupVO[]>([]);
  const currentGroup = ref<GroupVO | null>(null);
  const currentGroupMembers = ref<GroupMemberVO[]>([]);
  const loading = ref(false);

  // ==================== 计算属性 ====================
  const groupsCount = computed(() => groups.value.length);

  const activeGroups = computed(() =>
    groups.value.filter(g => g.status === 'ACTIVE')
  );

  const myOwnedGroups = computed(() =>
    groups.value.filter(g => g.myRole === 'OWNER')
  );

  // ==================== 操作方法 ====================

  /**
   * 加载群组列表
   */
  async function loadGroups() {
    loading.value = true;
    try {
      const res = await linxApi.groups.getList();
      if (res.code === 0) {
        groups.value = res.data || [];
      } else {
        ElMessage.error(res.message);
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载群组详情
   */
  async function loadGroupDetails(groupId: number) {
    try {
      const res = await linxApi.groups.getDetails(groupId);
      if (res.code === 0) {
        currentGroup.value = res.data;

        return res.data;
      }
      ElMessage.error(res.message);
    } catch {
      ElMessage.error('获取群组详情失败');
    }
  }

  /**
   * 加载群组成员
   */
  async function loadGroupMembers(groupId: number) {
    try {
      const res = await linxApi.groups.getMembers(groupId);
      if (res.code === 0) {
        currentGroupMembers.value = res.data || [];

        return res.data;
      }
      ElMessage.error(res.message);
    } catch {
      ElMessage.error('获取群组成员失败');
    }
  }

  /**
   * 创建群组
   */
  async function createGroup(
    name: string,
    description?: string,
    initialMembers?: number[]
  ) {
    try {
      const res = await linxApi.groups.create({
        name,
        description,
        initialMembers,
      });
      if (res.code === 0) {
        ElMessage.success('群组创建成功');
        await loadGroups();

        return res.data;
      }
      ElMessage.error(res.message);
    } catch {
      ElMessage.error('创建群组失败');
    }
  }

  /**
   * 加入群组
   */
  async function joinGroup(groupId: number) {
    try {
      const res = await linxApi.groups.join(groupId);
      if (res.code === 0) {
        ElMessage.success('已加入群组');
        await loadGroups();

        return true;
      }
      ElMessage.error(res.message);

      return false;
    } catch {
      ElMessage.error('加入群组失败');

      return false;
    }
  }

  /**
   * 退出群组
   */
  async function leaveGroup(groupId: number) {
    try {
      const res = await linxApi.groups.leave(groupId);
      if (res.code === 0) {
        ElMessage.success('已退出群组');
        groups.value = groups.value.filter(g => g.id !== groupId);

        return true;
      }
      ElMessage.error(res.message);

      return false;
    } catch {
      ElMessage.error('退出群组失败');

      return false;
    }
  }

  /**
   * 解散群组
   */
  async function disbandGroup(groupId: number) {
    try {
      const res = await linxApi.groups.disband(groupId);
      if (res.code === 0) {
        ElMessage.success('群组已解散');
        groups.value = groups.value.filter(g => g.id !== groupId);

        return true;
      }
      ElMessage.error(res.message);

      return false;
    } catch {
      ElMessage.error('解散群组失败');

      return false;
    }
  }

  /**
   * 移除群组成员
   */
  async function removeMember(groupId: number, userId: number) {
    try {
      const res = await linxApi.groups.removeMember(groupId, userId);
      if (res.code === 0) {
        ElMessage.success('成员已移除');
        currentGroupMembers.value = currentGroupMembers.value.filter(
          m => m.userId !== userId
        );

        return true;
      }
      ElMessage.error(res.message);

      return false;
    } catch {
      ElMessage.error('移除成员失败');

      return false;
    }
  }

  /**
   * 设置成员角色
   */
  async function setMemberRole(groupId: number, userId: number, role: string) {
    try {
      const res = await linxApi.groups.setMemberRole(groupId, userId, role);
      if (res.code === 0) {
        ElMessage.success('角色已更新');

        // 更新本地状态
        const member = currentGroupMembers.value.find(m => m.userId === userId);
        if (member) {
          member.role = role as any;
        }

        return true;
      }
      ElMessage.error(res.message);

      return false;
    } catch {
      ElMessage.error('设置角色失败');

      return false;
    }
  }

  /**
   * 搜索群组
   */
  async function searchGroups(keyword: string) {
    try {
      const res = await linxApi.groups.search(keyword);
      if (res.code === 0) {
        return res.data || [];
      }
      ElMessage.error(res.message);

      return [];
    } catch {
      ElMessage.error('搜索群组失败');

      return [];
    }
  }

  /**
   * 根据ID获取群组
   */
  function getGroupById(groupId: number): GroupVO | undefined {
    return groups.value.find(g => g.id === groupId);
  }

  /**
   * 初始化
   */
  async function initialize() {
    await loadGroups();
  }

  /**
   * 清空状态
   */
  function reset() {
    groups.value = [];
    currentGroup.value = null;
    currentGroupMembers.value = [];
    loading.value = false;
  }

  return {
    // 状态
    groups,
    currentGroup,
    currentGroupMembers,
    loading,

    // 计算属性
    groupsCount,
    activeGroups,
    myOwnedGroups,

    // 方法
    loadGroups,
    loadGroupDetails,
    loadGroupMembers,
    createGroup,
    joinGroup,
    leaveGroup,
    disbandGroup,
    removeMember,
    setMemberRole,
    searchGroups,
    getGroupById,
    initialize,
    reset,
  };
});
