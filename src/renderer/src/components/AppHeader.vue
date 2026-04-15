<template>
  <header
    class="flex justify-between items-center px-6 py-2 w-full bg-[#f7f9fb] dark:bg-slate-900 select-none"
    @mousedown="handleDragStart"
  >
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
          placeholder="搜索任务..."
          type="text"
        />
      </div>
      <button
        class="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-semibold shadow-sm hover:opacity-90 active:scale-95 duration-150 transition-all"
        @click="$emit('addTask')"
      >
        <span class="material-symbols-outlined text-sm">add</span>
        <span class="text-sm">添加任务</span>
      </button>
      <div class="flex items-center gap-2 ml-2">
        <button class="p-2 hover:bg-[#e0e3e5] dark:hover:bg-slate-700 rounded-full transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">notifications</span>
        </button>
        <div class="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden">
          <img
            alt="用户头像"
            class="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuClau6SroaEv-oqQb7jc7frEybxIKG5u9KcT1fhIUo8czvGF-aOCbkoVEhiB_NshV-zalZ3kYHJjsHPsF-WFGI9OxvkZBWIxtTDMUoNEv_MVTht1EzMH1oNtXVaetsIxhZwxtPu-6PglALIoDIKv6S9Y3UzTE1TpVHL8FFmivsSDXm_BQtES9GP2ulyx8s5sPJ6gAHA0whQX7LxAYvvFqujzCQXpMX_CJfJYHThs3SbiQBbuKgrsYX6tVAjBHCie5qK1lJYrT5cMGqL"
          />
        </div>
      </div>
    </div>
    <div class="flex items-center ml-4 shrink-0">
      <button
        id="btn-minimize"
        class="w-10 h-8 flex items-center justify-center hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant cursor-pointer"
        @click="handleMinimize"
      >
        <span class="material-symbols-outlined text-lg">minimize</span>
      </button>
      <button
        id="btn-maximize"
        class="w-10 h-8 flex items-center justify-center hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant cursor-pointer"
        @click="handleMaximize"
      >
        <span class="material-symbols-outlined text-lg">{{ isMax ? 'filter_none' : 'crop_square' }}</span>
      </button>
      <button
        id="btn-close"
        class="w-10 h-8 flex items-center justify-center hover:bg-error hover:text-on-error rounded-lg transition-colors text-on-surface-variant cursor-pointer"
        @click="handleClose"
      >
        <span class="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineEmits(['addTask'])

const isMax = ref(false)

let lastScreenX = 0
let lastScreenY = 0
let isDragging = false

function handleDragStart(e) {
  const target = e.target
  const targetId = target.id || target.closest('[id]')?.id
  if (targetId === 'btn-minimize' || targetId === 'btn-maximize' || targetId === 'btn-close') return
  if (target.closest('button')) return
  if (target.tagName === 'INPUT' || target.tagName === 'A') return
  if (e.button !== 0) return

  e.preventDefault()
  isDragging = true
  lastScreenX = e.screenX
  lastScreenY = e.screenY

  if (window.electronAPI?.windowDragStart) {
    window.electronAPI.windowDragStart()
  }

  const handleMove = (moveEvent) => {
    if (!isDragging) return
    const deltaX = moveEvent.screenX - lastScreenX
    const deltaY = moveEvent.screenY - lastScreenY
    lastScreenX = moveEvent.screenX
    lastScreenY = moveEvent.screenY
    if (window.electronAPI?.windowDragMove) {
      window.electronAPI.windowDragMove(deltaX, deltaY)
    }
  }

  const handleUp = () => {
    isDragging = false
    if (window.electronAPI?.windowDragEnd) {
      window.electronAPI.windowDragEnd()
    }
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
  }

  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleUp)
}

async function handleMinimize() {
  try {
    await window.electronAPI?.minimizeWindow()
  } catch (err) {
    console.error('[AppHeader] minimize error:', err)
  }
}

async function handleMaximize() {
  try {
    await window.electronAPI?.maximizeWindow()
    isMax.value = !!(await window.electronAPI?.isMaximized())
  } catch (err) {
    console.error('[AppHeader] maximize error:', err)
  }
}

function handleClose() {
  if (window.electronAPI?.closeWindow) {
    window.electronAPI.closeWindow().catch(() => {
      window.close()
    })
  } else {
    window.close()
  }
}

let pollTimer = null

onMounted(async () => {
  try {
    isMax.value = !!(await window.electronAPI?.isMaximized())
  } catch (_) {}
  pollTimer = setInterval(async () => {
    try {
      isMax.value = !!(await window.electronAPI?.isMaximized())
    } catch (_) {}
  }, 1000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
})

const navItems = ref([
  { label: '工作台', active: true },
  { label: '数据分析', active: false },
  { label: '团队', active: false }
])
</script>
