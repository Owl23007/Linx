<template>
  <aside class="w-64 bg-white border-r border-gray-200 flex flex-col h-screen overflow-y-auto">
    <!-- 用户信息区 -->
    <div class="p-4 border-b border-gray-100 flex items-center space-x-3">
      <div class="relative">
        <el-avatar :size="40" :src="user.avatar" class="cursor-pointer hover:scale-105 transition-transform" />
        <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
      </div>

      <div class="hidden sm:block">
        <p class="font-medium text-gray-800">{{ user.name }}</p>
        <p class="text-xs text-gray-500">在线</p>
      </div>
    </div>

    <!-- 导航菜单 -->
    <el-menu
      default-active="/"
      class="flex-1 pt-6 px-2"
      mode="vertical"
      background-color="#ffffff"
      text-color="#475569"
      active-text-color="#2563eb"
      router
    >
      <!-- 消息 -->
      <el-menu-item index="/messages">
        <template #title>
          <div class="flex items-center space-x-3">
            <i class="fa fa-comment-dots text-lg"></i>
            <span class="hidden sm:inline">消息</span>
            <el-badge :value="1" class="ml-auto" type="danger" :hidden="false" />
          </div>
        </template>
      </el-menu-item>

      <!-- 个人资料 -->
      <el-menu-item index="/profile">
        <template #title>
          <div class="flex items-center space-x-3">
            <i class="fa fa-user text-lg"></i>
            <span class="hidden sm:inline">个人资料</span>
          </div>
        </template>
      </el-menu-item>

      <!-- 收藏 -->
      <el-menu-item index="/favorites">
        <template #title>
          <div class="flex items-center space-x-3">
            <i class="fa fa-star text-lg"></i>
            <span class="hidden sm:inline">收藏</span>
          </div>
        </template>
      </el-menu-item>

      <!-- 标签 -->
      <el-menu-item index="/tags">
        <template #title>
          <div class="flex items-center space-x-3">
            <i class="fa fa-tags text-lg"></i>
            <span class="hidden sm:inline">标签</span>
          </div>
        </template>
      </el-menu-item>

      <!-- 地图 -->
      <el-menu-item index="/map">
        <template #title>
          <div class="flex items-center space-x-3">
            <i class="fa fa-map-marker-alt text-lg"></i>
            <span class="hidden sm:inline">地图</span>
          </div>
        </template>
      </el-menu-item>

      <!-- 刷新 -->
      <el-menu-item index="/refresh">
        <template #title>
          <div class="flex items-center space-x-3">
            <i class="fa fa-sync-alt text-lg"></i>
            <span class="hidden sm:inline">刷新</span>
          </div>
        </template>
      </el-menu-item>

      <!-- 天气 -->
      <el-menu-item index="/weather">
        <template #title>
          <div class="flex items-center space-x-3">
            <i class="fa fa-cloud-sun text-lg"></i>
            <span class="hidden sm:inline">天气</span>
          </div>
        </template>
      </el-menu-item>

      <!-- 小程序 -->
      <el-menu-item index="/mini-app">
        <template #title>
          <div class="flex items-center space-x-3">
            <i class="fa fa-mobile-alt text-lg"></i>
            <span class="hidden sm:inline">小程序</span>
          </div>
        </template>
      </el-menu-item>

      <!-- 分割线 -->
      <el-menu-item disabled class="mt-6 border-t border-gray-100 py-3">
        <template #title>
          <div class="flex items-center justify-center text-xs text-gray-400">
            系统工具
          </div>
        </template>
      </el-menu-item>

      <!-- 邮件 -->
      <el-menu-item index="/mail">
        <template #title>
          <div class="flex items-center space-x-3">
            <i class="fa fa-envelope text-lg"></i>
            <span class="hidden sm:inline">邮件</span>
            <el-badge :value="3" class="ml-auto" type="danger" />
          </div>
        </template>
      </el-menu-item>

      <!-- 文件夹 -->
      <el-menu-item index="/folders">
        <template #title>
          <div class="flex items-center space-x-3">
            <i class="fa fa-folder text-lg"></i>
            <span class="hidden sm:inline">文件夹</span>
          </div>
        </template>
      </el-menu-item>

      <!-- 书签 -->
      <el-menu-item index="/bookmarks">
        <template #title>
          <div class="flex items-center space-x-3">
            <i class="fa fa-bookmark text-lg"></i>
            <span class="hidden sm:inline">书签</span>
          </div>
        </template>
      </el-menu-item>

      <!-- 更多 -->
      <el-menu-item index="/more">
        <template #title>
          <div class="flex items-center space-x-3">
            <i class="fa fa-ellipsis-v text-lg"></i>
            <span class="hidden sm:inline">更多</span>
          </div>
        </template>
      </el-menu-item>
    </el-menu>
  </aside>
</template>

<script lang="ts" setup>
const user = {
  name: '张三',
  avatar: 'https://via.placeholder.com/40?text=ZS'
};
</script>

<style scoped>
.el-menu-item:hover {
  background-color: #f8fafc !important;
}

/* 小屏幕下隐藏文字 */
@media (max-width: 640px) {
  .hidden.sm\\:inline {
    display: none !important;
  }
}
</style>
