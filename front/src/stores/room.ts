import linxApi from '@/services/linxApiService';
import type { CreateRoomDto, JoinRoomDto, RoomVO } from '@/types/room';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useRoomStore = defineStore('room', () => {
  const rooms = ref<RoomVO[]>([]);
  const currentRoom = ref<RoomVO | null>(null);
  const loading = ref(false);

  const roomCount = computed(() => rooms.value.length);

  async function loadRooms() {
    loading.value = true;
    try {
      const res = await linxApi.rooms.getMine();
      if (res.code === 0) {
        rooms.value = res.data || [];
      } else {
        ElMessage.error(res.message || '加载房间列表失败');
      }
    } finally {
      loading.value = false;
    }
  }

  async function openRoom(roomId: number): Promise<RoomVO | null> {
    try {
      const res = await linxApi.rooms.getDetails(roomId);
      if (res.code === 0 && res.data) {
        currentRoom.value = res.data;
        return res.data;
      }
      ElMessage.error(res.message || '加载房间详情失败');
      return null;
    } catch {
      ElMessage.error('加载房间详情失败');
      return null;
    }
  }

  async function createRoom(payload: CreateRoomDto): Promise<RoomVO | null> {
    try {
      const res = await linxApi.rooms.create(payload);
      if (res.code === 0 && res.data) {
        currentRoom.value = res.data;
        ElMessage.success('房间创建成功');
        await loadRooms();
        return res.data;
      }
      ElMessage.error(res.message || '创建房间失败');
      return null;
    } catch {
      ElMessage.error('创建房间失败');
      return null;
    }
  }

  async function joinRoom(payload: JoinRoomDto): Promise<RoomVO | null> {
    try {
      const res = await linxApi.rooms.join(payload);
      if (res.code === 0 && res.data) {
        currentRoom.value = res.data;
        ElMessage.success('已加入房间');
        await loadRooms();
        return res.data;
      }
      ElMessage.error(res.message || '加入房间失败');
      return null;
    } catch {
      ElMessage.error('加入房间失败');
      return null;
    }
  }

  async function initialize() {
    await loadRooms();
  }

  function reset() {
    rooms.value = [];
    currentRoom.value = null;
    loading.value = false;
  }

  return {
    rooms,
    currentRoom,
    loading,
    roomCount,
    loadRooms,
    openRoom,
    createRoom,
    joinRoom,
    initialize,
    reset,
  };
});
