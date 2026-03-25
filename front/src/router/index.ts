// router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/pages/login/index.vue'),
  },
  {
    path: '/main',
    redirect: { name: 'MainHome' },
  },
  {
    path: '/main/home',
    name: 'MainHome',
    component: () => import('@/views/pages/lobby/index.vue'),
    meta: {
      sidebarKey: 'home',
    },
  },
  {
    path: '/main/rooms',
    name: 'MainRooms',
    component: () => import('@/views/pages/lobby/index.vue'),
    meta: {
      sidebarKey: 'rooms',
    },
  },
  {
    path: '/main/diagnostics',
    name: 'MainDiagnostics',
    component: () => import('@/views/pages/lobby/index.vue'),
    meta: {
      sidebarKey: 'diagnostics',
    },
  },
  {
    path: '/',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
