<template>
  <aside class="flex flex-col h-full p-4 border-r border-transparent bg-[#f2f4f6] dark:bg-slate-800 w-64 shrink-0">
    <div class="flex items-center gap-3 mb-8 px-2">
      <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg">
        <span class="material-symbols-outlined">architecture</span>
      </div>
      <div>
        <div class="text-lg font-extrabold text-[#191c1e] dark:text-white leading-tight">任务工作室</div>
        <div class="text-[11px] font-medium text-on-surface-variant uppercase tracking-[5%]">专业版</div>
      </div>
    </div>

    <nav class="flex-1 space-y-1">
      <router-link
        v-for="item in menuItems"
        :key="item.route"
        :to="item.route"
        :class="[
          'flex items-center gap-3 px-4 py-3 rounded-lg hover:translate-x-1 transition-transform duration-200',
          isActive(item.route)
            ? 'bg-white dark:bg-slate-700 text-[#0051c9] dark:text-blue-300 shadow-sm font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-[#e0e3e5] dark:hover:bg-slate-700/50'
        ]"
      >
        <span class="material-symbols-outlined">{{ item.icon }}</span>
        <span class="text-[11px] uppercase tracking-[5%]">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="mt-auto space-y-4">
      <router-link
        to="/schedule"
        class="w-full flex items-center justify-center gap-2 bg-tertiary text-on-tertiary py-3 rounded-xl font-bold shadow-md active:opacity-80 transition-all"
      >
        <span class="material-symbols-outlined text-sm">timer</span>
        <span class="text-xs uppercase tracking-wider">开始计时</span>
      </router-link>
      <div class="pt-4 border-t border-outline-variant/20 flex flex-col gap-1">
        <a class="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-primary transition-colors" href="#">
          <span class="material-symbols-outlined text-lg">help_outline</span>
          <span class="text-[11px] uppercase tracking-[5%]">帮助</span>
        </a>
        <button
          class="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-error transition-colors w-full text-left"
          @click="handleQuit"
        >
          <span class="material-symbols-outlined text-lg">power_settings_new</span>
          <span class="text-[11px] uppercase tracking-[5%]">退出软件</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const menuItems = [
  { icon: 'check_circle', label: '我的任务', route: '/my-tasks' },
  { icon: 'checklist', label: '待办事项', route: '/todo-items' },
  { icon: 'calendar_today', label: '日历', route: '/calendar' },
  { icon: 'folder', label: '项目', route: '/projects' },
  { icon: 'schedule', label: '日程', route: '/schedule' }
]

function isActive(path) {
  return route.path === path
}

async function handleQuit() {
  await window.electronAPI.closeWindow()
}
</script>
