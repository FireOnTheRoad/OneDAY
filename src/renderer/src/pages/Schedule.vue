<template>
  <div class="flex-1 flex flex-col bg-surface-container-low overflow-hidden">
    <div class="p-6 border-b border-surface-container bg-surface-container-lowest">
      <div class="flex justify-between items-center mb-5">
        <div>
          <h2 class="text-xl font-extrabold text-on-surface headline">日程</h2>
          <p class="text-on-surface-variant font-medium text-sm mt-1">
            今日已记录 {{ formatDuration(todayTotalSeconds) }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="!timerState.running"
            class="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
            @click="startTimer"
          >
            <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
            <span class="text-sm">开始计时</span>
          </button>
          <div v-else class="flex items-center gap-2">
            <button
              class="flex items-center gap-2 bg-tertiary text-on-tertiary px-4 py-2.5 rounded-xl font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
              @click="pauseTimer"
            >
              <span class="material-symbols-outlined text-sm">pause</span>
              <span class="text-sm">暂停</span>
            </button>
            <button
              class="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
              @click="resumeTimer"
            >
              <span class="material-symbols-outlined text-sm">play_arrow</span>
              <span class="text-sm">继续</span>
            </button>
            <button
              class="flex items-center gap-2 bg-error text-on-error px-4 py-2.5 rounded-xl font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
              @click="stopTimer"
            >
              <span class="material-symbols-outlined text-sm">stop</span>
              <span class="text-sm">停止</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="timerState.running || timerState.paused" class="bg-primary p-5 rounded-2xl text-on-primary shadow-lg shadow-primary/20">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <div
              :class="[
                'w-12 h-12 rounded-full flex items-center justify-center',
                timerState.running ? 'bg-white/20 animate-pulse' : 'bg-white/10'
              ]"
            >
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">
                {{ timerState.running ? 'timer' : 'pause_circle' }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <input
                v-model="timerTaskTitle"
                class="w-full bg-transparent border-b border-on-primary/30 focus:border-on-primary text-base font-bold placeholder:text-on-primary/50 outline-none pb-1 transition-colors"
                placeholder="输入当前任务内容..."
                type="text"
              />
              <div class="text-[10px] uppercase tracking-widest font-bold opacity-70 mt-1">
                {{ timerState.running ? '计时中' : '已暂停' }} · 开始于 {{ formatTime(timerState.startTime) }}
              </div>
            </div>
          </div>
          <div class="text-3xl font-mono font-bold tracking-tighter ml-4">
            {{ timerDisplay }}
          </div>
        </div>
        <div v-if="timerState.running" class="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div class="h-full bg-white/60 rounded-full transition-all duration-1000" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div class="relative" :style="{ height: timelineHeight + 'px' }">
        <div class="absolute inset-0 flex flex-col">
          <div
            v-for="hour in timeSlots"
            :key="hour"
            class="border-b border-surface-container-highest flex items-start pt-2 px-2 text-[10px] font-bold text-on-surface-variant/40"
            :style="{ height: HOUR_HEIGHT + 'px' }"
          >
            {{ hour }}
          </div>
        </div>

        <div
          v-for="record in todayRecords"
          :key="record.id"
          :class="[
            'absolute left-16 right-0 backdrop-blur-sm border-l-4 rounded-r-xl p-3 group transition-all',
            recordBgClass
          ]"
          :style="getRecordStyle(record)"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1 min-w-0">
              <div class="font-bold text-on-surface text-sm truncate">{{ record.taskTitle }}</div>
              <div class="text-[10px] text-on-surface-variant mt-0.5">
                {{ formatTime(record.startTime) }} - {{ formatTime(record.endTime) }}
                <span class="font-bold ml-1">{{ formatDuration(record.durationSeconds) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="p-1 hover:bg-surface-container-high rounded-full transition-colors"
                @click="editRecord(record)"
              >
                <span class="material-symbols-outlined text-sm text-on-surface-variant">edit</span>
              </button>
              <button
                class="p-1 hover:bg-error-container/30 rounded-full transition-colors"
                @click="handleDeleteRecord(record.id)"
              >
                <span class="material-symbols-outlined text-sm text-error">delete</span>
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="timerState.running || timerState.paused"
          class="absolute left-16 right-0 bg-primary/15 border-l-4 border-primary rounded-r-xl p-3 z-10"
          :style="getTimerBlockStyle()"
        >
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-sm animate-pulse" style="font-variation-settings: 'FILL' 1;">timer</span>
            <span class="font-bold text-primary text-sm truncate">{{ timerTaskTitle || '未命名任务' }}</span>
          </div>
          <div class="text-[10px] text-primary/70 mt-0.5">
            {{ formatTime(timerState.startTime) }} - 进行中
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showEditModal = false"></div>
          <div class="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div class="flex items-center justify-between p-6 border-b border-surface-container">
              <h2 class="text-lg font-extrabold text-on-surface headline">编辑时间记录</h2>
              <button class="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant" @click="showEditModal = false">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">任务内容 *</label>
                <input
                  v-model="editForm.taskTitle"
                  class="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm"
                  type="text"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">开始时间</label>
                  <input
                    v-model="editForm.startTime"
                    class="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm"
                    type="time"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">结束时间</label>
                  <input
                    v-model="editForm.endTime"
                    class="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm"
                    type="time"
                  />
                </div>
              </div>
              <div class="flex gap-3 pt-2">
                <button
                  class="flex-1 py-3 rounded-xl font-bold text-on-surface-variant bg-surface-container-high hover:bg-surface-variant transition-all"
                  @click="showEditModal = false"
                >取消</button>
                <button
                  class="flex-1 py-3 rounded-xl font-bold bg-primary text-on-primary hover:opacity-90 active:scale-95 transition-all shadow-sm"
                  @click="saveEdit"
                >保存</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTimeRecordStore } from '../store/timeRecordStore'

const store = useTimeRecordStore()

const timerState = ref({
  running: false,
  paused: false,
  startTime: null,
  elapsedSeconds: 0,
  pausedAt: null,
  totalPausedSeconds: 0
})

const timerTaskTitle = ref('')
const timerInterval = ref(null)
const showEditModal = ref(false)
const editForm = ref({ id: '', taskTitle: '', startTime: '', endTime: '' })

const START_HOUR = 6
const END_HOUR = 23
const HOUR_HEIGHT = 80

const timeSlots = []
for (let h = START_HOUR; h < END_HOUR; h++) {
  timeSlots.push(`${String(h).padStart(2, '0')}:00`)
}

const timelineHeight = computed(() => (END_HOUR - START_HOUR) * HOUR_HEIGHT)

const todayRecords = computed(() => store.getTodayRecords())
const todayTotalSeconds = computed(() => store.getTodayTotalSeconds())

const timerDisplay = computed(() => {
  const total = timerState.value.elapsedSeconds
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const progressPercent = computed(() => {
  const seconds = timerState.value.elapsedSeconds % 3600
  return (seconds / 3600) * 100
})

const recordBgClass = 'bg-primary-container/20 border-primary hover:bg-primary-container/30'

function startTimer() {
  timerState.value = {
    running: true,
    paused: false,
    startTime: new Date(),
    elapsedSeconds: 0,
    pausedAt: null,
    totalPausedSeconds: 0
  }
  timerTaskTitle.value = ''
  startTick()
}

function pauseTimer() {
  timerState.value.paused = true
  timerState.value.running = false
  timerState.value.pausedAt = new Date()
  stopTick()
}

function resumeTimer() {
  if (timerState.value.pausedAt) {
    const pausedDuration = (Date.now() - timerState.value.pausedAt.getTime()) / 1000
    timerState.value.totalPausedSeconds += pausedDuration
  }
  timerState.value.paused = false
  timerState.value.running = true
  timerState.value.pausedAt = null
  startTick()
}

async function stopTimer() {
  stopTick()

  if (!timerTaskTitle.value.trim()) {
    timerTaskTitle.value = '未命名任务'
  }

  const endTime = new Date()
  const duration = Math.round((endTime.getTime() - timerState.value.startTime.getTime() - timerState.value.totalPausedSeconds * 1000) / 1000)

  if (duration > 0) {
    await store.addRecord({
      taskTitle: timerTaskTitle.value.trim(),
      startTime: timerState.value.startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationSeconds: Math.max(1, duration)
    })
  }

  timerState.value = {
    running: false,
    paused: false,
    startTime: null,
    elapsedSeconds: 0,
    pausedAt: null,
    totalPausedSeconds: 0
  }
  timerTaskTitle.value = ''
}

function startTick() {
  stopTick()
  timerInterval.value = setInterval(() => {
    if (timerState.value.startTime) {
      const elapsed = (Date.now() - timerState.value.startTime.getTime() - timerState.value.totalPausedSeconds * 1000) / 1000
      timerState.value.elapsedSeconds = Math.floor(elapsed)
    }
  }, 200)
}

function stopTick() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
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

function getRecordStyle(record) {
  const start = new Date(record.startTime)
  const end = new Date(record.endTime)
  const startOffset = (start.getHours() + start.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT
  const durationHours = Math.max(0.25, (end.getTime() - start.getTime()) / 3600000)
  const height = durationHours * HOUR_HEIGHT

  return {
    top: Math.max(0, startOffset) + 'px',
    height: height + 'px'
  }
}

function getTimerBlockStyle() {
  if (!timerState.value.startTime) return { top: '0px', height: '40px' }
  const start = new Date(timerState.value.startTime)
  const startOffset = (start.getHours() + start.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT
  const now = new Date()
  const durationHours = Math.max(0.25, (now.getTime() - start.getTime()) / 3600000)

  return {
    top: Math.max(0, startOffset) + 'px',
    height: (durationHours * HOUR_HEIGHT) + 'px'
  }
}

function editRecord(record) {
  const start = new Date(record.startTime)
  const end = new Date(record.endTime)
  editForm.value = {
    id: record.id,
    taskTitle: record.taskTitle,
    startTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
    endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
  }
  showEditModal.value = true
}

async function saveEdit() {
  if (!editForm.value.taskTitle.trim()) return

  const today = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

  const [sh, sm] = editForm.value.startTime.split(':').map(Number)
  const [eh, em] = editForm.value.endTime.split(':').map(Number)

  const startIso = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm).toISOString()
  const endIso = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em).toISOString()
  const duration = Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000))

  await store.updateRecord(editForm.value.id, {
    taskTitle: editForm.value.taskTitle.trim(),
    startTime: startIso,
    endTime: endIso,
    durationSeconds: duration
  })

  showEditModal.value = false
}

async function handleDeleteRecord(id) {
  await store.deleteRecord(id)
}

onMounted(async () => {
  await store.loadRecords()
})

onUnmounted(() => {
  stopTick()
})
</script>
