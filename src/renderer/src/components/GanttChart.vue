<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
    <div class="border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
      <h3 class="text-lg font-bold text-on-surface">时间线</h3>
      <div class="flex items-center gap-2">
        <button
          v-for="view in timeScaleOptions"
          :key="view.value"
          @click="currentScale = view.value"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            currentScale === view.value
              ? 'bg-primary text-on-primary'
              : 'text-on-surface-variant hover:bg-outline-variant/10'
          ]"
        >
          {{ view.label }}
        </button>
      </div>
    </div>

    <div v-if="validTasks.length === 0" class="p-12 text-center">
      <span class="material-symbols-outlined text-5xl text-outline-variant mb-4 block">timeline</span>
      <p class="text-on-surface-variant">暂无时间线数据</p>
      <p class="text-on-surface-variant/60 text-sm mt-1">请为任务设置开始日期和持续天数</p>
    </div>

    <div
      v-else
      ref="container"
      class="relative overflow-x-auto overflow-y-auto"
      style="min-height: 400px"
    >
      <canvas
        ref="canvas"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
        @click="handleClick"
        class="cursor-pointer"
      ></canvas>

      <div
        v-if="hoveredTask"
        class="fixed z-50 bg-surface-container-lowest dark:bg-slate-900 rounded-lg shadow-xl p-4 pointer-events-none border border-outline-variant/20"
        :style="{ top: tooltipPosition.y + 'px', left: tooltipPosition.x + 'px' }"
      >
        <h4 class="font-bold text-on-surface mb-2">{{ hoveredTask.title }}</h4>
        <div class="space-y-1 text-sm text-on-surface-variant">
          <p>开始日期：{{ hoveredTask.startDate }}</p>
          <p>持续天数：{{ hoveredTask.duration }} 天</p>
          <p>优先级：{{ priorityLabels[hoveredTask.priority] }}</p>
          <p v-if="hoveredTask.description" class="text-xs mt-2 line-clamp-2">{{ hoveredTask.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['taskClick'])

const canvas = ref(null)
const container = ref(null)
const currentScale = ref('day')
const hoveredTask = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

const timeScaleOptions = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' }
]

const priorityLabels = {
  high: '高',
  medium: '中',
  low: '低'
}

const priorityColors = {
  high: '#E53935',
  medium: '#F9A825',
  low: '#43A047'
}

const validTasks = computed(() => {
  return props.tasks.filter(t => t.startDate && t.duration)
})

const timeRange = computed(() => {
  if (validTasks.value.length === 0) return { start: null, end: null }

  const startDates = validTasks.value.map(t => new Date(t.startDate))
  const minDate = new Date(Math.min(...startDates))

  const endDates = validTasks.value.map(t => {
    const start = new Date(t.startDate)
    start.setDate(start.getDate() + t.duration)
    return start
  })
  const maxDate = new Date(Math.max(...endDates))

  minDate.setDate(minDate.getDate() - 3)
  maxDate.setDate(maxDate.getDate() + 3)

  return { start: minDate, end: maxDate }
})

let ctx = null
let taskBars = []

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', resizeCanvas)
})

watch([validTasks, currentScale], () => {
  nextTick(() => {
    resizeCanvas()
    draw()
  })
})

function initCanvas() {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    resizeCanvas()
  }
}

function resizeCanvas() {
  if (!canvas.value || !container.value || !timeRange.value.start) return

  const tasks = validTasks.value
  if (tasks.length === 0) return

  const { start, end } = timeRange.value
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

  const TASK_HEIGHT = 36
  const TASK_GAP = 8
  const HEADER_HEIGHT = 40
  const LEFT_PADDING = 120

  const contentHeight = HEADER_HEIGHT + tasks.length * (TASK_HEIGHT + TASK_GAP) + 20
  const contentWidth = LEFT_PADDING + totalDays * getDayWidth() + 20

  canvas.value.width = Math.max(container.value.offsetWidth, contentWidth)
  canvas.value.height = Math.max(container.value.offsetHeight, contentHeight)

  draw()
}

function getDayWidth() {
  switch (currentScale.value) {
    case 'day': return 30
    case 'week': return 15
    case 'month': return 5
    default: return 30
  }
}

function draw() {
  if (!ctx || !timeRange.value.start || validTasks.value.length === 0) return

  const { width, height } = canvas.value
  const tasks = validTasks.value
  const { start, end } = timeRange.value
  const dayWidth = getDayWidth()

  const TASK_HEIGHT = 36
  const TASK_GAP = 8
  const HEADER_HEIGHT = 40
  const LEFT_PADDING = 120

  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = '#f8f9fa'
  ctx.fillRect(0, 0, width, height)

  drawTimeScale(start, end, dayWidth, LEFT_PADDING, HEADER_HEIGHT)

  taskBars = []
  tasks.forEach((task, index) => {
    const y = HEADER_HEIGHT + index * (TASK_HEIGHT + TASK_GAP) + 10

    ctx.fillStyle = '#1f2937'
    ctx.font = '13px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const taskName = task.title.length > 12 ? task.title.substring(0, 12) + '...' : task.title
    ctx.fillText(taskName, 10, y + TASK_HEIGHT / 2)

    const taskStart = new Date(task.startDate)
    const daysFromStart = Math.floor((taskStart - start) / (1000 * 60 * 60 * 24))
    const x = LEFT_PADDING + daysFromStart * dayWidth
    const barWidth = task.duration * dayWidth

    taskBars.push({
      task,
      x,
      y,
      width: barWidth,
      height: TASK_HEIGHT
    })

    const color = priorityColors[task.priority] || priorityColors.medium
    ctx.fillStyle = color

    const radius = 4
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + barWidth - radius, y)
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius)
    ctx.lineTo(x + barWidth, y + TASK_HEIGHT - radius)
    ctx.quadraticCurveTo(x + barWidth, y + TASK_HEIGHT, x + barWidth - radius, y + TASK_HEIGHT)
    ctx.lineTo(x + radius, y + TASK_HEIGHT)
    ctx.quadraticCurveTo(x, y + TASK_HEIGHT, x, y + TASK_HEIGHT - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()

    if (task.status === 'completed') {
      ctx.fillStyle = 'rgba(255,255,255, 0.3)'
      ctx.fill()
    }

    ctx.fillStyle = '#ffffff'
    ctx.font = '11px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    const taskWidth = ctx.measureText(task.title).width
    const maxWidth = barWidth - 8

    if (maxWidth > 20) {
      let displayTitle = task.title
      if (taskWidth > maxWidth) {
        const charWidth = taskWidth / task.title.length
        const maxChars = Math.floor(maxWidth / charWidth)
        displayTitle = task.title.substring(0, maxChars - 2) + '...'
      }
      ctx.fillText(displayTitle, x + 4, y + TASK_HEIGHT / 2)
    }
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysFromToday = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  const todayX = LEFT_PADDING + daysFromToday * dayWidth

  if (todayX >= LEFT_PADDING && todayX < width) {
    ctx.strokeStyle = '#0051c9'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(todayX, HEADER_HEIGHT)
    ctx.lineTo(todayX, height)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#0051c9'
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('今天', todayX, HEADER_HEIGHT - 5)
  }
}

function drawTimeScale(startDate, endDate, dayWidth, leftPadding, headerHeight) {
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.value.width, headerHeight)

  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1

  ctx.font = '11px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const interval = currentScale.value === 'day' ? 1 : currentScale.value === 'week' ? 7 : 30

  for (let i = 0; i < totalDays; i += interval) {
    const x = leftPadding + i * dayWidth
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    ctx.beginPath()
    ctx.moveTo(x, headerHeight)
    ctx.lineTo(x, canvas.value.height)
    ctx.stroke()

    ctx.fillStyle = '#6b7280'
    const label = formatDateLabel(date)
    ctx.fillText(label, x + interval * dayWidth / 2, headerHeight / 2)
  }
}

function formatDateLabel(date) {
  switch (currentScale.value) {
    case 'day':
      return `${date.getMonth() + 1}/${date.getDate()}`
    case 'week':
      return `W${getWeekNumber(date)}`
    case 'month':
      return `${date.getMonth() + 1}月`
    default:
      return `${date.getMonth() + 1}/${date.getDate()}`
  }
}

function getWeekNumber(date) {
  const onejan = new Date(date.getFullYear(), 0, 1)
  const numberOfDays = Math.floor((date - onejan) / (24 * 60 * 60 * 1000))
  return Math.ceil((date.getDay() + 1 + numberOfDays) / 7)
}

function handleMouseMove(event) {
  if (!canvas.value) return

  const rect = canvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const bar = taskBars.find(b =>
    x >= b.x && x <= b.x + b.width &&
    y >= b.y && y <= b.y + b.height
  )

  if (bar) {
    hoveredTask.value = bar.task
    tooltipPosition.value = {
      x: event.clientX + 15,
      y: event.clientY + 15
    }
    canvas.value.style.cursor = 'pointer'
  } else {
    hoveredTask.value = null
    canvas.value.style.cursor = 'default'
  }
}

function handleMouseLeave() {
  hoveredTask.value = null
}

function handleClick() {
  if (hoveredTask.value) {
    emit('taskClick', hoveredTask.value)
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
