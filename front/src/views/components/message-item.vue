<template>
  <div :class="[
    'flex gap-3 group',
    isSent ? 'flex-row-reverse' : 'flex-row'
  ]">
    <!-- 头像 -->
    <el-avatar :size="36" class="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
      @click="handleAvatarClick">
      {{ displayName[0] }}
    </el-avatar>

    <!-- 消息内容 -->
    <div :class="['flex flex-col gap-1 max-w-[60%]', isSent ? 'items-end' : 'items-start']">
      <!-- 发送者信息 -->
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span v-if="!isSent" class="font-medium">{{ displayName }}</span>
        <span class="text-gray-400">{{ formattedTime }}</span>
        <el-icon v-if="message.isRead && isSent" class="text-blue-500" :size="12">
          <Check />
        </el-icon>
      </div>

      <!-- 消息气泡 -->
      <div :class="[
        'rounded-lg px-4 py-2 break-words transition-all',
        'group-hover:shadow-md',
        isSent
          ? 'bg-blue-500 text-white rounded-tr-none'
          : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
      ]">
        <!-- 文本消息 -->
        <div v-if="message.type === 'CHAT'" class="whitespace-pre-wrap leading-relaxed">
          {{ message.content }}
        </div>

        <!-- 图片消息 -->
        <div v-else-if="message.type === 'IMAGE'" class="max-w-xs cursor-pointer" @click="handleImagePreview">
          <el-image :src="message.content" fit="cover" class="rounded" lazy>
            <template #error>
              <div class="flex items-center justify-center h-32 bg-gray-100">
                <el-icon :size="32" class="text-gray-400">
                  <Picture />
                </el-icon>
              </div>
            </template>
          </el-image>
        </div>

        <!-- 文件消息 -->
        <div v-else-if="message.type === 'FILE'" class="flex items-center gap-3 cursor-pointer hover:bg-opacity-90"
          @click="handleFileDownload">
          <el-icon :size="32" :class="isSent ? 'text-white' : 'text-blue-500'">
            <Document />
          </el-icon>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">{{ fileName }}</div>
            <div :class="['text-xs', isSent ? 'text-blue-100' : 'text-gray-500']">
              {{ fileSize }}
            </div>
          </div>
        </div>

        <!-- 语音消息 -->
        <div v-else-if="message.type === 'VOICE'" class="flex items-center gap-3">
          <el-button circle :type="isSent ? 'info' : 'primary'" size="small" @click="handleVoicePlay">
            <el-icon>
              <VideoPlay v-if="!isPlaying" />
              <VideoPause v-else />
            </el-icon>
          </el-button>
          <span class="text-sm">{{ voiceDuration }}s</span>
        </div>

        <!-- 系统消息 -->
        <div v-else-if="message.type === 'SYSTEM'" class="text-xs text-center text-gray-500">
          {{ message.content }}
        </div>
      </div>

      <!-- 消息状态（发送中/失败） -->
      <div v-if="isSent && sendStatus" class="flex items-center gap-1 text-xs">
        <el-icon v-if="sendStatus === 'sending'" class="is-loading text-gray-400">
          <Loading />
        </el-icon>
        <el-button v-else-if="sendStatus === 'failed'" type="danger" text size="small" @click="handleResend">
          <el-icon>
            <RefreshRight />
          </el-icon>
          重新发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/types/chat';
import { formatChatTime } from '@/utils/datetime';
import {
  Check,
  Document,
  Loading,
  Picture,
  RefreshRight,
  VideoPause,
  VideoPlay,
} from '@element-plus/icons-vue';
import { ElImageViewer, ElMessage } from 'element-plus';
import { computed, ref } from 'vue';

// Props
const props = defineProps<{
  message: ChatMessage;
  currentUserId: number;
  sendStatus?: 'sending' | 'failed' | 'success';
}>();

// Emits
const emit = defineEmits<{
  (e: 'resend', messageId: string): void;
  (e: 'avatar-click', userId: number): void;
}>();

// State
const isPlaying = ref(false);

// Computed
const isSent = computed(() => props.message.senderId === props.currentUserId);

const displayName = computed(() => props.message.senderName || '未知用户');

const formattedTime = computed(() => formatChatTime(props.message.timestamp));

const fileName = computed(() => {
  try {
    const fileInfo = JSON.parse(props.message.extra || '{}');

    return fileInfo.name || '未知文件';
  } catch {
    return '未知文件';
  }
});

const fileSize = computed(() => {
  try {
    const fileInfo = JSON.parse(props.message.extra || '{}');
    const size = fileInfo.size || 0;
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)}KB`;

    return `${(size / (1024 * 1024)).toFixed(2)}MB`;
  } catch {
    return '0B';
  }
});

const voiceDuration = computed(() => {
  try {
    const voiceInfo = JSON.parse(props.message.extra || '{}');

    return voiceInfo.duration || 0;
  } catch {
    return 0;
  }
});

// Methods
function handleAvatarClick() {
  emit('avatar-click', props.message.senderId);
}

function handleImagePreview() {
  // 使用 Element Plus 的图片预览
  ElImageViewer({
    urlList: [props.message.content],
  });
}

function handleFileDownload() {
  // 创建下载链接
  const link = document.createElement('a');
  link.href = props.message.content;
  link.download = fileName.value;
  link.click();
  ElMessage.success('开始下载');
}

function handleVoicePlay() {
  if (isPlaying.value) {
    // 停止播放
    isPlaying.value = false;
  } else {
    // 开始播放
    isPlaying.value = true;
    // TODO: 实现音频播放逻辑
    setTimeout(() => {
      isPlaying.value = false;
    }, voiceDuration.value * 1000);
  }
}

function handleResend() {
  emit('resend', props.message.messageId);
}
</script>

<style scoped lang="less">
/* 自定义样式可以在这里添加 */
</style>
