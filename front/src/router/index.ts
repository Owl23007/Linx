import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/pages/login/index.vue'),
  },
  {
    path: '/main',
    name: 'MainPannel',
    component: () => import('@/views/pages/main-pannel/index.vue'),
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
