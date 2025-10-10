import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useGlobalStore = defineStore('gobal', () => {
  const endpoint = ref<string>(import.meta.env.VITE_DEFAULT_BASE_URL);

  async function setEndpoint(newEndpoint: string) {
    if (newEndpoint && newEndpoint !== endpoint.value) {
      // 只在不同的时候才更新
      endpoint.value = newEndpoint;
    }
  }

  return { endpoint, setEndpoint };
});
