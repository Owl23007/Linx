<template>
  <div class="flex flex-col bg-white border-t border-gray-200">
    <!-- 工具栏 -->
    <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
      <el-button text @click="showEmojiPicker = !showEmojiPicker" class="hover:bg-gray-100">
        <el-icon :size="20">
          <ChatDotRound />
        </el-icon>
      </el-button>

      <el-upload :show-file-list="false" :before-upload="handleImageUpload" accept="image/*">
        <el-button text class="hover:bg-gray-100">
          <el-icon :size="20">
            <Picture />
          </el-icon>
        </el-button>
      </el-upload>

      <el-upload :show-file-list="false" :before-upload="handleFileUpload">
        <el-button text class="hover:bg-gray-100">
          <el-icon :size="20">
            <Paperclip />
          </el-icon>
        </el-button>
      </el-upload>

      <el-button text @click="handleVoiceRecord" class="hover:bg-gray-100">
        <el-icon :size="20">
          <Microphone />
        </el-icon>
      </el-button>

      <div class="flex-1"></div>

      <el-button text @click="showHistory = true" class="hover:bg-gray-100">
        <el-icon :size="20">
          <Clock />
        </el-icon>
      </el-button>
    </div>

    <!-- 表情选择器 -->
    <div v-if="showEmojiPicker" class="px-4 py-3 bg-gray-50 border-b border-gray-200">
      <emoji-picker @select="handleEmojiSelect" />
    </div>

    <!-- 输入区域 -->
    <div class="px-4 py-3">
      <el-input v-model="inputText" type="textarea" :rows="4" placeholder="输入消息... (Enter发送，Ctrl+Enter换行)"
        :maxlength="5000" show-word-limit resize="none" class="message-textarea"
        @keydown.enter.exact.prevent="handleSend" @keydown.ctrl.enter.exact="inputText += '\n'" @input="handleTyping" />
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center justify-between px-4 py-3">
      <div class="text-xs text-gray-500">
        <span v-if="typingUsers.length > 0">
          {{ typingUsers.join('、') }} 正在输入...
        </span>
      </div>

      <div class="flex gap-2">
        <el-button @click="handleClear">清空</el-button>
        <el-button type="primary" :disabled="!inputText.trim()" :loading="sending" @click="handleSend">
          发送 (Enter)
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound, Clock, Microphone, Paperclip, Picture } from '@element-plus/icons-vue';
import type { UploadRawFile } from 'element-plus';
import { ElMessage } from 'element-plus';
import { ref } from 'vue';
import EmojiPicker from './emoji-picker.vue';

// Props
defineProps<{
  typingUsers?: string[];
}>();

// Emits
const emit = defineEmits<{
  (e: 'send', content: string, type?: 'CHAT' | 'IMAGE' | 'FILE' | 'VOICE'): void;
  (e: 'typing'): void;
}>();

// State
const inputText = ref('');
const sending = ref(false);
const showEmojiPicker = ref(false);
const showHistory = ref(false);

// Typing indicator
let typingTimer: ReturnType<typeof setTimeout> | null = null;

// Methods
function handleSend() {
  const text = inputText.value.trim();
  if (!text) return;

  emit('send', text, 'CHAT');
  inputText.value = '';
  showEmojiPicker.value = false;
}

function handleClear() {
  inputText.value = '';
}

function handleEmojiSelect(emoji: string) {
  inputText.value += emoji;
  showEmojiPicker.value = false;
}

function handleTyping() {
  // 防抖处理，只在停止输入500ms后取消typing状态
  if (typingTimer) {
    clearTimeout(typingTimer);
  }

  emit('typing');

  typingTimer = setTimeout(() => {
    // 停止typing状态
  }, 500);
}

async function handleImageUpload(file: UploadRawFile) {
  // 检查文件大小（限制10MB）
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过10MB');

    return false;
  }

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件');

    return false;
  }

  try {
    // TODO: 实现图片上传到服务器的逻辑
    // const url = await uploadImage(file);
    const url = URL.createObjectURL(file);
    emit('send', url, 'IMAGE');
    ElMessage.success('图片发送成功');
  } catch (error) {
    ElMessage.error('图片上传失败');
    console.error(error);
  }

  return false;
}

async function handleFileUpload(file: UploadRawFile) {
  // 检查文件大小（限制100MB）
  if (file.size > 100 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过100MB');

    return false;
  }

  try {
    // TODO: 实现文件上传到服务器的逻辑
    // const url = await uploadFile(file);
    const url = URL.createObjectURL(file);
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      url,
    };
    emit('send', JSON.stringify(fileInfo), 'FILE');
    ElMessage.success('文件发送成功');
  } catch (error) {
    ElMessage.error('文件上传失败');
    console.error(error);
  }

  return false;
}

function handleVoiceRecord() {
  ElMessage.info('语音录制功能开发中...');
  // TODO: 实现语音录制功能
}
</script>

<style scoped lang="less">
:deep(.message-textarea) {
  .el-textarea__inner {
    border: none;
    box-shadow: none;
    padding: 0;
    font-size: 14px;
    line-height: 1.6;
    resize: none;

    &:focus {
      border: none;
      box-shadow: none;
    }
  }

  .el-input__count {
    background: transparent;
    bottom: 0;
    right: 0;
  }
}
</style>
