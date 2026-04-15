<template>
  <section class="w-1/2 h-full flex flex-col bg-surface-container-low">
    <div class="p-6 border-b border-surface-container bg-surface-container-lowest">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-extrabold text-on-surface headline">日程与追踪</h2>
        <div class="flex items-center gap-2 bg-surface-container p-1 rounded-lg">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="[
              'px-3 py-1 text-xs font-bold rounded',
              tab.value === activeTab
                ? 'bg-surface-container-lowest shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            ]"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div v-if="activeTimer" class="flex items-center justify-between bg-primary p-4 rounded-2xl text-on-primary shadow-lg shadow-primary/20">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">timer</span>
          </div>
          <div>
            <div class="text-[10px] uppercase tracking-widest font-bold opacity-80">正在追踪</div>
            <div class="font-bold text-lg">{{ activeTimer.taskTitle || '未命名任务' }}</div>
          </div>
        </div>
        <div class="text-3xl font-mono font-bold tracking-tighter">
          {{ activeTimerDisplay }}
        </div>
      </div>
      <div v-else class="flex items-center justify-between bg-surface-container p-4 rounded-2xl">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center">
            <span class="material-symbols-outlined text-on-surface-variant">timer_off</span>
          </div>
          <div>
            <div class="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">未在追踪</div>
            <div class="font-bold text-lg text-on-surface-variant">点击日程页开始计时</div>
          </div>
        </div>
        <router-link
          to="/schedule"
          class="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <span class="material-symbols-outlined text-sm">play_arrow</span>
          <span class="text-sm">开始</span>
        </router-link>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div class="relative" :style="{ height: timelineHeight + 'px' }">
        <div class="absolute inset-0 flex flex-col">
          <div
            v-for="hour in timeSlots"
            :key="hour.label"
            class="border-b border-surface-container-highest flex items-start pt-2 px-2 text-[10px] font-bold text-on-surface-variant/40"
            :style="{ height: HOUR_HEIGHT + 'px' }"
          >
            {{ hour.label }}
          </div>
        </div>

        <div
          v-for="record in todayRecords"
          :key="record.id"
          class="absolute left-16 right-0 backdrop-blur-sm border-l-4 border-primary rounded-r-xl p-3 bg-primary-container/20 hover:bg-primary-container/30 transition-all"
          :style="getRecordStyle(record)"
        >
          <div class="font-bold text-on-surface text-sm truncate">{{ record.taskTitle }}</div>
          <div class="text-[10px] text-on-surface-variant mt-0.5">
            {{ formatTime(record.startTime) }} - {{ formatTime(record.endTime) }}
            <span class="font-bold ml-1">{{ formatDuration(record.durationSeconds) }}</span>
          </div>
        </div>

        <div
          class="absolute left-16 right-0 h-[2px] bg-error z-10 before:content-[''] before:absolute before:w-3 before:h-3 before:bg-error before:rounded-full before:-left-1.5 before:-top-[5px]"
          :style="{ top: currentTimeLineTop + 'px' }"
        ></div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTimeRecordStore } from '../store/timeRecordStore'

const store = useTimeRecordStore()

const activeTab = ref('day')
const tabs = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' }
]

const START_HOUR = 6
const END_HOUR = 23
const HOUR_HEIGHT = 80

const timeSlots = []
for (let h = START_HOUR; h < END_HOUR; h++) {
  timeSlots.push({ label: `${String(h).padStart(2, '0')}:00`, hour: h })
}

const timelineHeight = computed(() => (END_HOUR - START_HOUR) * HOUR_HEIGHT)

const todayRecords = computed(() => store.getTodayRecords())

const activeTimer = computed(() => {
  return null
})

const activeTimerDisplay = computed(() => '00:00:00')

const currentTimeLineTop = computed(() => {
  const now = new Date()
  const hours = now.getHours() + now.getMinutes() / 60
  return Math.max(0, (hours - START_HOUR) * HOUR_HEIGHT)
})

function getRecordStyle(record) {
  const start = new Date(record.startTime)
  const end = new Date(record.endTime)
  const startOffset = (start.getHours() + start.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT
  const durationHours = Math.max(0.25, (end.getTime() - start.getTime()) / 3600000)
  return {
    top: Math.max(0, startOffset) + 'px',
    height: (durationHours * HOUR_HEIGHT) + 'px'
  }
}

function formatTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0分钟'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}小时${m > 0 ? m + '分钟' : ''}`
  return `${m}分钟`
}

let refreshTimer = null

onMounted(async () => {
  await store.loadRecords()
  refreshTimer = setInterval(() => {
    void 0
  }, 60000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>
