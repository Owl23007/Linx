import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useGlobalStore = defineStore('gobal', () => {
  const endpoint = ref<string>(import.meta.env.VITE_DEFAULT_BASE_URL);
  const routes = ref<any[]>([]);

  async function setEndpoint(newEndpoint: string) {
    if (newEndpoint && newEndpoint !== endpoint.value) {
      // 只在不同的时候才更新
      endpoint.value = newEndpoint;
    }
  }

  async function setRoutes(newRoutes: any[]) {
    if (newRoutes && newRoutes !== routes.value) {
      // 只在不同的时候才更新
      routes.value = newRoutes;
    }
  }

  return { endpoint, setEndpoint, routes, setRoutes };
});
