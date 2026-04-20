<template>
  <section class="w-1/2 h-full flex flex-col bg-surface-container-low">
    <!-- 顶部状态栏 -->
    <div class="p-4 border-b border-surface-container bg-surface-container-lowest">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-extrabold text-on-surface headline">时间轴</h2>
        <div class="flex items-center gap-2 text-sm text-on-surface-variant">
          <span class="material-symbols-outlined text-sm">schedule</span>
          <span>{{ formatDuration(todayTotalSeconds) }}</span>
        </div>
      </div>

      <!-- 当前计时器状态 -->
      <div v-if="timerState.running" class="flex items-center justify-between bg-primary p-3 rounded-xl text-on-primary shadow-lg">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">timer</span>
          </div>
          <div class="min-w-0">
            <div class="text-[10px] uppercase tracking-widest font-bold opacity-70">计时中</div>
            <div class="font-bold text-sm truncate">{{ timerTaskTitle || '未命名任务' }}</div>
          </div>
        </div>
        <div class="text-xl font-mono font-bold tracking-tight">
          {{ timerDisplay }}
        </div>
      </div>
      <div v-else class="flex items-center justify-between bg-surface-container p-3 rounded-xl">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center">
            <span class="material-symbols-outlined text-on-surface-variant text-sm">timer_off</span>
          </div>
          <div class="text-sm text-on-surface-variant">未在追踪</div>
        </div>
        <router-link
          to="/schedule"
          class="flex items-center gap-1 bg-primary text-on-primary px-3 py-1.5 rounded-lg font-bold text-xs hover:opacity-90 transition-all"
        >
          <span class="material-symbols-outlined text-sm">play_arrow</span>
          <span>开始</span>
        </router-link>
      </div>
    </div>

    <!-- Toggl Track 风格时间轴 -->
    <div class="flex-1 overflow-hidden p-4">
      <div class="h-full flex flex-col">
        <!-- 时间刻度行 -->
        <div class="flex items-center h-6 border-b border-surface-container-high">
          <div class="w-12 shrink-0"></div>
          <div class="flex-1 flex">
            <div
              v-for="hour in timeSlots"
              :key="hour"
              class="flex-1 text-[10px] font-bold text-on-surface-variant/50 text-center border-l border-surface-container-highest"
            >
              {{ hour }}
            </div>
          </div>
        </div>

        <!-- 时间轴主体 -->
        <div class="flex-1 overflow-y-auto relative">
          <!-- 背景网格线 -->
          <div class="absolute inset-0 flex">
            <div class="w-12 shrink-0 bg-surface-container-lowest"></div>
            <div class="flex-1 flex flex-col">
              <div
                v-for="i in 17"
                :key="i"
                class="flex-1 border-b border-surface-container-highest/50"
              ></div>
            </div>
          </div>

          <!-- 时间记录块 -->
          <div class="relative flex items-center h-6">
            <div class="w-12 shrink-0"></div>
            <div class="flex-1 flex items-center h-full">
              <div
                v-for="record in todayRecords"
                :key="record.id"
                :class="[
                  'absolute h-5 rounded-md shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center px-2 overflow-hidden',
                  getRecordColor(record)
                ]"
                :style="getRecordStyle(record)"
                :title="record.taskTitle + ' (' + formatDuration(record.durationSeconds) + ')'"
              >
                <span class="text-[10px] font-bold text-white truncate drop-shadow-sm">
                  {{ record.taskTitle }}
                </span>
              </div>
            </div>
          </div>

          <!-- 当前时间指示线 -->
          <div
            class="absolute top-0 bottom-0 w-0.5 bg-error z-10"
            :style="{ left: currentTimePosition + '%' }"
          >
            <div class="absolute -top-1 -left-1.5 w-3 h-3 bg-error rounded-full"></div>
          </div>
        </div>

        <!-- 底部日期显示 -->
        <div class="flex items-center justify-between pt-3 border-t border-surface-container">
          <button
            class="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors"
            @click="prevDay"
          >
            <span class="material-symbols-outlined text-on-surface-variant">chevron_left</span>
          </button>
          <div class="text-sm font-bold text-on-surface">
            {{ isToday ? '今天' : formatDisplayDate(selectedDate) }}
          </div>
          <button
            class="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors"
            @click="nextDay"
          >
            <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTimeRecordStore } from '../store/timeRecordStore'

const store = useTimeRecordStore()

// 日期选择
const today = new Date()
const todayStr = computed(() => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
})
const selectedDate = ref(todayStr.value)

const isToday = computed(() => selectedDate.value === todayStr.value)

// 时间刻度 (6:00 - 23:00)
const START_HOUR = 6
const END_HOUR = 23
const timeSlots = []
for (let h = START_HOUR; h <= END_HOUR; h++) {
  timeSlots.push(`${String(h).padStart(2, '0')}:00`)
}

// 当天记录
const todayRecords = computed(() => {
  return store.getRecordsByDate(selectedDate.value)
})

// 当天总时长
const todayTotalSeconds = computed(() => {
  return todayRecords.value.reduce((sum, r) => sum + (r.durationSeconds || 0), 0)
})

// 当前时间位置 (百分比)
const currentTimePosition = computed(() => {
  const now = new Date()
  const hours = now.getHours() + now.getMinutes() / 60
  if (hours < START_HOUR || hours > END_HOUR) return -1
  return ((hours - START_HOUR) / (END_HOUR - START_HOUR)) * 100
})

// 计时器状态 (从 store 获取)
const timerState = computed(() => store.timerState)
const timerTaskTitle = computed(() => store.timerTaskTitle)
const timerDisplay = computed(() => store.timerDisplay)

// 颜色方案
const colorPalette = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-indigo-500'
]

function getRecordColor(record) {
  const index = record.id ? record.id.charCodeAt(0) % colorPalette.length : 0
  return colorPalette[index]
}

function getRecordStyle(record) {
  if (!record.startTime || !record.endTime) {
    return { left: '0%', width: '0%' }
  }
  
  const start = new Date(record.startTime)
  const end = new Date(record.endTime)
  
  const startHours = start.getHours() + start.getMinutes() / 60
  const endHours = end.getHours() + end.getMinutes() / 60
  
  // 限制在可视范围内
  const clampedStart = Math.max(START_HOUR, startHours)
  const clampedEnd = Math.min(END_HOUR, endHours)
  
  if (clampedEnd <= clampedStart) {
    return { left: '0%', width: '0%' }
  }
  
  const left = ((clampedStart - START_HOUR) / (END_HOUR - START_HOUR)) * 100
  const width = ((clampedEnd - clampedStart) / (END_HOUR - START_HOUR)) * 100
  
  return {
    left: `${left}%`,
    width: `${Math.max(1, width)}%`
  }
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0分钟'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${month}月${day}日 周${weekDays[d.getDay()]}`
}

function prevDay() {
  const d = new Date(selectedDate.value + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  selectedDate.value = d.toISOString().split('T')[0]
}

function nextDay() {
  const d = new Date(selectedDate.value + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  selectedDate.value = d.toISOString().split('T')[0]
}

let refreshTimer = null

onMounted(async () => {
  await store.loadRecords()
  refreshTimer = setInterval(() => {
    // 触发响应式更新
  }, 60000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>
