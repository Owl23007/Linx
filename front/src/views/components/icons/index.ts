// 自动导出所有图标组件
// 添加新图标时，只需在此目录添加 *.vue 文件即可自动导出
import type { Component } from 'vue';

const iconModules = import.meta.glob<Component>('./*.vue', { eager: true, import: 'default' });

const icons: Record<string, Component> = {};

for (const path in iconModules) {
  // 将 ./fullscreen-exit.vue 转换为 FullscreenExit
  const name = path
    .replace('./', '')
    .replace('.vue', '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  icons[name] = iconModules[path] as Component;
}

export default icons;
