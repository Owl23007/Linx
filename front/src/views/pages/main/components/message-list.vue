<template>
  <div class="h-full bg-gray-50 flex flex-col">
    <!-- 搜索栏 -->
    <div class="flex items-center justify-between p-3 border-b border-gray-200 bg-white shadow-sm">
      <el-input v-model="search" placeholder="搜索" prefix-icon="Search" clearable size="small" class="w-full max-w-xs" />
      <el-button type="primary" size="small" @click="onAddClick" class="ml-2">
        <el-icon>
          <Plus />
        </el-icon>
      </el-button>
    </div>

    <!-- 聊天列表 -->
    <div class="flex-1 overflow-y-auto px-2 py-2 space-y-2">
      <div v-for="(item, index) in filteredChats" :key="index"
        class="flex items-center p-3 rounded-lg hover:bg-white cursor-pointer transition-colors duration-150 shadow-sm"
        :class="{ 'bg-blue-50': item.selected }" @click="onChatClick(item)">
        <!-- 头像 -->
        <el-avatar :src="item.avatar" size="40" class="mr-3" />

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
import { Plus } from '@element-plus/icons-vue';
import { ElAvatar, ElButton, ElIcon, ElInput } from 'element-plus';
import { computed, ref } from 'vue';

// 数据示例
const chats = [
  {
    id: 1,
    name: '曙光黎明对策组',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    lastMessage: '混凝土萨满：[图片]',
    time: '昨天 21:43',
    unread: 0,
    selected: false
  },
  {
    id: 2,
    name: '计算机23级...',
    avatar: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
    lastMessage: '方老师邀请请北陌加入了群聊，...',
    time: '昨天 10:27',
    unread: 0,
    selected: false
  },
  {
    id: 3,
    name: '软件2班水群',
    avatar: 'https://cube.elemecdn.com/3/74/d875d4137884e8e157810c25d870apng.png',
    lastMessage: '赵亚多：@全体成员 已经到...',
    time: '08/31',
    unread: 0,
    selected: false
  },
  {
    id: 4,
    name: '晓丽',
    avatar: 'https://cube.elemecdn.com/6/78/4656787900181587726664100520cpng.png',
    lastMessage: '[动画表情]',
    time: '08/11',
    unread: 0,
    selected: false
  },
  {
    id: 5,
    name: '2025年WUST计...',
    avatar: 'https://cube.elemecdn.com/3/66/7564671991394967457294321763bpng.png',
    lastMessage: '林晓丽：中南赛区的获奖证书...',
    time: '07/12',
    unread: 0,
    selected: false
  },
  {
    id: 6,
    name: '2025计算机设计...',
    avatar: 'https://cube.elemecdn.com/8/28/7a7834689531183449114c13e312fpng.png',
    lastMessage: '晓丽：大家再确认一下 报名...',
    time: '04/23',
    unread: 0,
    selected: false
  },
  {
    id: 7,
    name: '神隐之里·喵喵喵喵~',
    avatar: 'https://cube.elemecdn.com/2/28/7a7834689531183449114c13e312fpng.png',
    lastMessage: '[有新文件]猫猫挂件，...',
    time: '17:15',
    unread: 99,
    selected: false
  },
  {
    id: 8,
    name: '麦麦大脑磁共振（...)',
    avatar: 'https://cube.elemecdn.com/0/72/3c71624761115153470159031082apng.png',
    lastMessage: '[有新文件]石翁紫葳：...',
    time: '17:13',
    unread: 99,
    selected: false
  }
];

const search = ref('');
const selectedChat = ref(null);

// 过滤聊天项
const filteredChats = computed(() => {
  if (!search.value) return chats;

  return chats.filter(item =>
    item.name.includes(search.value) ||
    item.lastMessage.includes(search.value)
  );
});

// 事件处理
const onChatClick = (item: any) => {
  selectedChat.value = item;
  // 可以触发父组件事件，比如 @select="handleSelect"
};

const onAddClick = () => {
  // 可以弹出创建群聊对话框
};
</script>

<style scoped>
/* 自定义样式 */
.el-input {
  --el-input-border-color-hover: #409eff;
  --el-input-border-color-focus: #409eff;
}
</style>
