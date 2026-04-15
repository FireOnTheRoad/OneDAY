<template>
  <header class="flex justify-between items-center px-6 py-3 w-full sticky top-0 z-50 bg-[#f7f9fb] dark:bg-slate-900">
    <div class="flex items-center gap-8">
      <span class="text-xl font-bold tracking-tight text-[#0051c9] dark:text-blue-400">ArchitectTask</span>
      <nav class="hidden md:flex gap-6 items-center">
        <a
          v-for="item in navItems"
          :key="item.label"
          :class="[
            item.active
              ? 'text-[#0051c9] dark:text-blue-400 font-bold border-b-2 border-[#0051c9] pb-1'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-[#0051c9] transition-colors'
          ]"
          href="#"
        >
          {{ item.label }}
        </a>
      </nav>
    </div>
    <div class="flex items-center gap-4">
      <div class="relative group">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined">search</span>
        <input
          class="pl-10 pr-4 py-2 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm w-64 transition-all"
          placeholder="Search tasks..."
          type="text"
        />
      </div>
      <button class="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-semibold shadow-sm hover:opacity-90 active:scale-95 duration-150 transition-all">
        <span class="material-symbols-outlined text-sm">add</span>
        <span class="text-sm">Add Task</span>
      </button>
      <div class="flex items-center gap-2 ml-2">
        <button class="p-2 hover:bg-[#e0e3e5] dark:hover:bg-slate-700 rounded-full transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">notifications</span>
        </button>
        <div class="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden">
          <img
            alt="User profile"
            class="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuClau6SroaEv-oqQb7jc7frEybxIKG5u9KcT1fhIUo8czvGF-aOCbkoVEhiB_NshV-zalZ3kYHJjsHPsF-WFGI9OxvkZBWIxtTDMUoNEv_MVTht1EzMH1oNtXVaetsIxhZwxtPu-6PglALIoDIKv6S9Y3UzTE1TpVHL8FFmivsSDXm_BQtES9GP2ulyx8s5sPJ6gAHA0whQX7LxAYvvFqujzCQXpMX_CJfJYHThs3SbiQBbuKgrsYX6tVAjBHCie5qK1lJYrT5cMGqL"
          />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'

const navItems = ref([
  { label: 'Dashboard', active: true },
  { label: 'Analytics', active: false },
  { label: 'Team', active: false }
])
</script>
