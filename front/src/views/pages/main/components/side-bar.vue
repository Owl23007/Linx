<template>
  <aside class="w-full h-full bg-white border-r border-gray-200 flex flex-col scroll-hidden">
    <!-- 用户信息区 -->
    <div class="p-4 border-b border-gray-100 flex items-center space-x-3 flex-shrink-0">
      <div class="relative">
        <el-avatar :size="40" :src="user.avatar" class="cursor-pointer hover:scale-105 transition-transform" />
        <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
      </div>
    </div>

    <!-- 导航菜单 -->
    <el-menu default-active="/" mode="vertical" background-color="#ffffff" text-color="#475569"
      active-text-color="#2563eb" router>
      <el-menu-item index="/messages" class="py-3">
        <template #title>
          <div class="flex items-center space-x-3">
            <el-icon>
              <Message />
            </el-icon>
            <el-badge :value="1" class="ml-auto" type="danger" :hidden="false" />
          </div>
        </template>
      </el-menu-item>

      <el-menu-item index="/profile" class="py-3">
        <template #title>
          <div class="flex items-center space-x-3">
            <el-icon>
              <User />
            </el-icon>
          </div>
        </template>
      </el-menu-item>

      <el-menu-item index="/favorites" class="py-3">
        <template #title>
          <div class="flex items-center space-x-3">
            <el-icon>
              <Star />
            </el-icon>
          </div>
        </template>
      </el-menu-item>

      <el-menu-item index="/mail" class="py-3">
        <template #title>
          <div class="flex items-center space-x-3">
            <el-icon>
              <Message />
            </el-icon>
            <el-badge :value="3" class="ml-auto" type="danger" />
          </div>
        </template>
      </el-menu-item>

      <el-menu-item index="/folders" class="py-3">
        <template #title>
          <div class="flex items-center space-x-3">
            <el-icon>
              <Folder />
            </el-icon>
          </div>
        </template>
      </el-menu-item>

      <el-menu-item index="/bookmarks" class="py-3">
        <template #title>
          <div class="flex items-center space-x-3">
            <el-icon>
              <Bookmark />
            </el-icon>
          </div>
        </template>
      </el-menu-item>

      <el-menu-item index="/more" class="py-3">
        <template #title>
          <div class="flex items-center space-x-3">
            <el-icon>
              <More />
            </el-icon>
          </div>
        </template>
      </el-menu-item>
    </el-menu>
  </aside>
</template>

<script lang="ts" setup>
import { Folder, Message, More, Star, User } from '@element-plus/icons-vue';

const user = {
  name: '张三',
  avatar: 'https://via.placeholder.com/40?text=ZS'
};
</script>

<style lang="less" scoped>
.el-menu-item:hover {
  background-color: #f8fafc !important;
}
</style>
