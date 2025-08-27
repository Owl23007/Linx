import { createRouter, createWebHistory } from 'vue-router';

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
    path: '/login-mvvm',
    name: 'LoginMVVM',
    component: () => import('@/views/pages/login/index-NEW.vue'),
  },
  {
    path: '/',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
