<template>
  <aside class="flex flex-col h-full p-4 border-r border-transparent bg-[#f2f4f6] dark:bg-slate-800 w-64 shrink-0">
    <div class="flex items-center gap-3 mb-8 px-2">
      <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg">
        <span class="material-symbols-outlined">architecture</span>
      </div>
      <div>
        <div class="text-lg font-extrabold text-[#191c1e] dark:text-white leading-tight">Task Studio</div>
        <div class="text-[11px] font-medium text-on-surface-variant uppercase tracking-[5%]">Pro Plan</div>
      </div>
    </div>

    <nav class="flex-1 space-y-1">
      <a
        v-for="item in menuItems"
        :key="item.label"
        :class="[
          'flex items-center gap-3 px-4 py-3 rounded-lg hover:translate-x-1 transition-transform duration-200',
          item.active
            ? 'bg-white dark:bg-slate-700 text-[#0051c9] dark:text-blue-300 shadow-sm font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-[#e0e3e5] dark:hover:bg-slate-700/50'
        ]"
        href="#"
      >
        <span class="material-symbols-outlined">{{ item.icon }}</span>
        <span class="text-[11px] uppercase tracking-[5%]">{{ item.label }}</span>
      </a>
    </nav>

    <div class="mt-auto space-y-4">
      <button class="w-full flex items-center justify-center gap-2 bg-tertiary text-on-tertiary py-3 rounded-xl font-bold shadow-md active:opacity-80 transition-all">
        <span class="material-symbols-outlined text-sm">timer</span>
        <span class="text-xs uppercase tracking-wider">Start Timer</span>
      </button>
      <div class="pt-4 border-t border-outline-variant/20 flex flex-col gap-1">
        <a class="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-primary transition-colors" href="#">
          <span class="material-symbols-outlined text-lg">help_outline</span>
          <span class="text-[11px] uppercase tracking-[5%]">Help</span>
        </a>
        <a class="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-error transition-colors" href="#">
          <span class="material-symbols-outlined text-lg">logout</span>
          <span class="text-[11px] uppercase tracking-[5%]">Sign Out</span>
        </a>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'

const menuItems = ref([
  { icon: 'check_circle', label: 'My Tasks', active: true },
  { icon: 'inbox', label: 'Inbox', active: false },
  { icon: 'calendar_today', label: 'Calendar', active: false },
  { icon: 'folder', label: 'Projects', active: false },
  { icon: 'archive', label: 'Archive', active: false }
])
</script>
