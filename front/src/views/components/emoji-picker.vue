<template>
  <div class="emoji-picker bg-white rounded-lg shadow-lg p-4">
    <div class="flex gap-2 mb-3 border-b border-gray-200 pb-2">
      <el-button v-for="category in categories" :key="category.name"
        :type="currentCategory === category.name ? 'primary' : 'default'" text size="small"
        @click="currentCategory = category.name">
        {{ category.icon }}
      </el-button>
    </div>

    <div class="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
      <button v-for="emoji in filteredEmojis" :key="emoji"
        class="text-2xl hover:bg-gray-100 rounded p-2 transition-colors cursor-pointer" @click="handleSelect(emoji)">
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

// Emits
const emit = defineEmits<{
  (e: 'select', emoji: string): void;
}>();

// State
const currentCategory = ref('smileys');

// Data
const categories = [
  { name: 'smileys', icon: '😊' },
  { name: 'people', icon: '👋' },
  { name: 'animals', icon: '🐶' },
  { name: 'food', icon: '🍔' },
  { name: 'activities', icon: '⚽' },
  { name: 'travel', icon: '✈️' },
  { name: 'objects', icon: '💡' },
  { name: 'symbols', icon: '❤️' },
];

const emojis = {
  smileys: [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
    '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
    '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
  ],
  people: [
    '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️',
    '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
    '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
    '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅',
  ],
  animals: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
    '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
  ],
  food: [
    '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙',
    '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈',
    '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜',
    '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡',
  ],
  activities: [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
    '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
    '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊',
    '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿',
  ],
  travel: [
    '✈️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛳',
    '⛴', '🛥', '🚢', '🚂', '🚃', '🚄', '🚅', '🚆',
    '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌',
    '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕',
  ],
  objects: [
    '💡', '🔦', '🏮', '🪔', '📱', '💻', '⌨️', '🖥',
    '🖨', '🖱', '🖲', '💾', '💿', '📀', '📹', '📷',
    '📸', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙',
    '🎚', '🎛', '🧭', '⏰', '⏱', '⏲', '⏳', '📡',
  ],
  symbols: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
    '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️',
    '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
  ],
};

// Computed
const filteredEmojis = computed(() => {
  return emojis[currentCategory.value as keyof typeof emojis] || [];
});

// Methods
function handleSelect(emoji: string) {
  emit('select', emoji);
}
</script>

<style scoped lang="less">
.emoji-picker {
  width: 100%;
  max-width: 360px;
}
</style>
