<template>
  <div class="flex-1 flex flex-col bg-surface-container-low overflow-hidden">
    <div class="p-6 border-b border-surface-container bg-surface-container-lowest">
      <div class="flex justify-between items-center mb-5">
        <div>
          <h2 class="text-xl font-extrabold text-on-surface headline">日程</h2>
          <p class="text-on-surface-variant font-medium text-sm mt-1">
            {{ selectedDate === todayStr ? '今日' : formatDisplayDate(selectedDate) }} 已记录 {{ formatDuration(selectedDateTotalSeconds) }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="!timerState.running"
            class="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
            @click="showStartModal = true"
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

      <!-- 日期导航 -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <button
            class="p-2 bg-surface-container-high rounded-lg hover:bg-surface-variant transition-colors"
            @click="prevDate"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            class="p-2 bg-surface-container-high rounded-lg hover:bg-surface-variant transition-colors"
            @click="nextDate"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
          <button
            class="px-3 py-1.5 bg-surface-container-high rounded-lg hover:bg-surface-variant transition-colors text-sm font-medium"
            @click="goToday"
          >
            今天
          </button>
        </div>
        <div class="flex items-center gap-2">
          <input
            v-model="selectedDate"
            type="date"
            class="px-3 py-1.5 bg-surface-container-highest border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
          />
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

    <!-- 按日期分组的日程记录 -->
    <div class="flex-1 overflow-y-auto p-6">
      <div v-if="store.state.loading" class="flex items-center justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
      </div>

      <div v-else-if="groupedRecords.length === 0" class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">event_note</span>
        <h3 class="text-lg font-bold text-on-surface-variant mb-1">暂无日程记录</h3>
        <p class="text-sm text-on-surface-variant/60">点击上方"开始计时"按钮创建新的日程记录</p>
      </div>

      <div v-else class="space-y-8">
        <div
          v-for="group in groupedRecords"
          :key="group.date"
          class="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container overflow-hidden"
        >
          <div class="px-6 py-3 bg-surface-container border-b border-surface-container flex justify-between items-center">
            <h3 class="font-bold text-on-surface">{{ formatDisplayDate(group.date) }}</h3>
            <span class="text-sm text-on-surface-variant">{{ formatDuration(getDateTotalSeconds(group.date)) }}</span>
          </div>
          <div class="p-6 space-y-3">
            <div
              v-for="record in group.records"
              :key="record.id"
              class="flex items-center gap-3 p-3 rounded-xl border-l-4 border-primary bg-primary-container/10 hover:bg-primary-container/20 transition-all"
            >
              <div class="w-16 text-sm font-bold text-on-surface-variant shrink-0">
                {{ formatTime(record.startTime) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-on-surface text-sm truncate">{{ record.taskTitle }}</div>
                <div class="text-[10px] text-on-surface-variant mt-0.5">
                  {{ formatTime(record.startTime) }} - {{ formatTime(record.endTime) }}
                  <span class="font-bold ml-1">{{ formatDuration(record.durationSeconds) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1">
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
        </div>
      </div>
    </div>

    <Teleport to="body">
      <!-- 开始计时模态框 -->
      <Transition name="modal">
        <div v-if="showStartModal" class="fixed inset-0 z-[100] flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showStartModal = false"></div>
          <div class="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div class="flex items-center justify-between p-6 border-b border-surface-container">
              <h2 class="text-lg font-extrabold text-on-surface headline">开始计时</h2>
              <button class="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant" @click="showStartModal = false">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">选择任务来源</label>
                <div class="flex gap-2">
                  <button
                    :class="[
                      'flex-1 py-3 rounded-xl font-bold text-sm transition-all',
                      startForm.taskSource === 'todo' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                    ]"
                    @click="startForm.taskSource = 'todo'"
                  >关联待办事项</button>
                  <button
                    :class="[
                      'flex-1 py-3 rounded-xl font-bold text-sm transition-all',
                      startForm.taskSource === 'manual' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                    ]"
                    @click="startForm.taskSource = 'manual'"
                  >手动记录</button>
                </div>
              </div>
              
              <!-- 关联待办事项 -->
              <div v-if="startForm.taskSource === 'todo'">
                <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">选择待办事项</label>
                <select
                  v-model="startForm.taskId"
                  class="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">-- 选择待办事项 --</option>
                  <option v-for="task in pendingTasks" :key="task.id" :value="task.id">{{ task.title }}</option>
                </select>
              </div>
              
              <!-- 手动输入 -->
              <div v-else-if="startForm.taskSource === 'manual'">
                <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">任务内容 *</label>
                <input
                  v-model="startForm.taskTitle"
                  class="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm"
                  type="text"
                  placeholder="输入任务内容..."
                />
              </div>
              
              <div class="flex gap-3 pt-2">
                <button
                  class="flex-1 py-3 rounded-xl font-bold text-on-surface-variant bg-surface-container-high hover:bg-surface-variant transition-all"
                  @click="showStartModal = false"
                >取消</button>
                <button
                  class="flex-1 py-3 rounded-xl font-bold bg-primary text-on-primary hover:opacity-90 active:scale-95 transition-all shadow-sm"
                  @click="confirmStart"
                  :disabled="!canStart"
                >开始</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
      
      <!-- 编辑时间记录模态框 -->
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
import { useTaskStore } from '../store/taskStore'

const store = useTimeRecordStore()
const taskStore = useTaskStore()

const timerState = ref({
  running: false,
  paused: false,
  startTime: null,
  elapsedSeconds: 0,
  pausedAt: null,
  totalPausedSeconds: 0,
  taskId: null
})

const timerTaskTitle = ref('')
const timerInterval = ref(null)
const showEditModal = ref(false)
const showStartModal = ref(false)
const editForm = ref({ id: '', taskTitle: '', startTime: '', endTime: '' })
const startForm = ref({
  taskSource: 'todo',
  taskId: '',
  taskTitle: ''
})

// 日期导航相关
const today = new Date()
const todayStr = computed(() => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
})
const selectedDate = ref(todayStr.value)

// 待办事项列表
const pendingTasks = computed(() => {
  return taskStore.getPendingTasks()
})

// 按日期分组的记录
const groupedRecords = computed(() => {
  return store.getRecordsGroupedByDate()
})

// 选中日期的记录
const selectedDateRecords = computed(() => {
  return store.getRecordsByDate(selectedDate.value)
})

// 选中日期的总时长
const selectedDateTotalSeconds = computed(() => {
  return selectedDateRecords.value.reduce((sum, r) => sum + (r.durationSeconds || 0), 0)
})

// 是否可以开始计时
const canStart = computed(() => {
  if (startForm.value.taskSource === 'todo') {
    return startForm.value.taskId
  } else {
    return startForm.value.taskTitle.trim()
  }
})

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

function confirmStart() {
  if (!canStart.value) return
  
  let taskTitle = ''
  let taskId = null
  
  if (startForm.value.taskSource === 'todo') {
    const task = taskStore.state.tasks.find(t => t.id === startForm.value.taskId)
    if (task) {
      taskTitle = task.title
      taskId = task.id
    }
  } else {
    taskTitle = startForm.value.taskTitle.trim()
  }
  
  timerState.value = {
    running: true,
    paused: false,
    startTime: new Date(),
    elapsedSeconds: 0,
    pausedAt: null,
    totalPausedSeconds: 0,
    taskId: taskId
  }
  timerTaskTitle.value = taskTitle
  showStartModal.value = false
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
      taskId: timerState.value.taskId,
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
    totalPausedSeconds: 0,
    taskId: null
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

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const dateOnly = date.toISOString().split('T')[0]
  const todayOnly = today.toISOString().split('T')[0]
  const yesterdayOnly = yesterday.toISOString().split('T')[0]
  const tomorrowOnly = tomorrow.toISOString().split('T')[0]
  
  if (dateOnly === todayOnly) return '今天'
  if (dateOnly === yesterdayOnly) return '昨天'
  if (dateOnly === tomorrowOnly) return '明天'
  
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${date.getMonth() + 1}月${date.getDate()}日 星期${weekDays[date.getDay()]}`
}

function getDateTotalSeconds(dateStr) {
  const records = store.getRecordsByDate(dateStr)
  return records.reduce((sum, r) => sum + (r.durationSeconds || 0), 0)
}

function prevDate() {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() - 1)
  selectedDate.value = date.toISOString().split('T')[0]
}

function nextDate() {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() + 1)
  selectedDate.value = date.toISOString().split('T')[0]
}

function goToday() {
  selectedDate.value = todayStr.value
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

  const record = store.state.records.find(r => r.id === editForm.value.id)
  if (!record) return

  const recordDate = new Date(record.startTime)
  const [sh, sm] = editForm.value.startTime.split(':').map(Number)
  const [eh, em] = editForm.value.endTime.split(':').map(Number)

  const startIso = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate(), sh, sm).toISOString()
  const endIso = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate(), eh, em).toISOString()
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
  await taskStore.loadTasks()
})

onUnmounted(() => {
  stopTick()
})
</script>
