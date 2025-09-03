import App from '@/App.vue';
import '@/gobal.css';
import router from '@/router';
import { pinia } from '@/stores';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createApp } from 'vue';

// 初始化应用

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.mount('#app');
