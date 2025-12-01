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
    name: 'Main',
    component: () => import('@/views/pages/lobby/index.vue'),
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
