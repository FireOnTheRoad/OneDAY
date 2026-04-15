<template>
  <div class="flex-1 flex flex-col bg-surface overflow-hidden">
    <div class="px-8 py-6 border-b border-surface-container">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-extrabold text-on-surface headline tracking-tight">日历</h2>
          <p class="text-on-surface-variant font-medium text-sm mt-1">
            {{ currentYear }}年{{ currentMonth + 1 }}月 · 共 {{ monthTasks.length }} 项待办
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="p-2 bg-surface-container-high rounded-lg hover:bg-surface-variant transition-colors"
            @click="goToday"
          >
            <span class="text-xs font-bold text-primary">今天</span>
          </button>
          <button
            class="p-2 bg-surface-container-high rounded-lg hover:bg-surface-variant transition-colors"
            @click="prevMonth"
          >
            <span class="material-symbols-outlined text-on-surface-variant">chevron_left</span>
          </button>
          <button
            class="p-2 bg-surface-container-high rounded-lg hover:bg-surface-variant transition-colors"
            @click="nextMonth"
          >
            <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div class="grid grid-cols-7 gap-px bg-surface-container rounded-2xl overflow-hidden">
        <div
          v-for="day in weekDays"
          :key="day"
          class="bg-surface-container-high py-3 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider"
        >
          {{ day }}
        </div>

        <div
          v-for="(cell, idx) in calendarCells"
          :key="idx"
          :class="[
            'min-h-[100px] p-2 transition-colors cursor-pointer',
            cell.isCurrentMonth ? 'bg-surface-container-lowest' : 'bg-surface-container-low/50',
            cell.isToday ? 'ring-2 ring-primary ring-inset' : '',
            cell.isCurrentMonth ? 'hover:bg-surface-container-low' : ''
          ]"
          @click="selectDate(cell)"
        >
          <div class="flex items-center justify-between mb-1">
            <span
              :class="[
                'text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full',
                cell.isToday
                  ? 'bg-primary text-on-primary'
                  : cell.isCurrentMonth
                    ? 'text-on-surface'
                    : 'text-on-surface-variant/40'
              ]"
            >
              {{ cell.day }}
            </span>
            <span
              v-if="cell.tasks.length > 0"
              class="text-[10px] font-bold text-primary"
            >{{ cell.tasks.length }}</span>
          </div>

          <div class="space-y-0.5">
            <div
              v-for="task in cell.tasks.slice(0, 3)"
              :key="task.id"
              :class="[
                'px-1.5 py-0.5 rounded text-[10px] font-bold truncate',
                taskDotClass(task)
              ]"
            >
              {{ task.title }}
            </div>
            <div
              v-if="cell.tasks.length > 3"
              class="text-[10px] text-on-surface-variant font-bold pl-1.5"
            >
              +{{ cell.tasks.length - 3 }} 更多
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedDate" class="mt-6 bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-extrabold text-on-surface headline">
            {{ selectedDateLabel }}
          </h3>
          <span class="text-xs font-bold text-on-surface-variant">
            {{ selectedDateTasks.length }} 项任务
          </span>
        </div>

        <div v-if="selectedDateTasks.length === 0" class="text-center py-8">
          <span class="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2 block">event_available</span>
          <p class="text-sm text-on-surface-variant">当天没有待办事项</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="task in selectedDateTasks"
            :key="task.id"
            :class="[
              'flex items-center gap-3 p-3 rounded-xl border-l-4 transition-all',
              task.status === 'completed' ? 'opacity-50' : '',
              priorityBorderClass(task.priority)
            ]"
          >
            <button
              class="shrink-0"
              @click="store.toggleTaskStatus(task.id)"
            >
              <span
                :class="[
                  'material-symbols-outlined text-lg',
                  task.status === 'completed' ? 'text-tertiary' : 'text-on-surface-variant'
                ]"
                :style="task.status === 'completed' ? 'font-variation-settings: \'FILL\' 1;' : ''"
              >{{ task.status === 'completed' ? 'check_circle' : 'radio_button_unchecked' }}</span>
            </button>
            <div class="flex-1 min-w-0">
              <div :class="['text-sm font-bold text-on-surface', task.status === 'completed' ? 'line-through' : '']">
                {{ task.title }}
              </div>
              <div v-if="task.description" class="text-xs text-on-surface-variant mt-0.5 truncate">{{ task.description }}</div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span
                :class="[
                  'text-[10px] font-bold px-2 py-0.5 rounded-full',
                  priorityBadgeClass(task.priority)
                ]"
              >{{ priorityLabel(task.priority) }}</span>
              <span
                v-if="task.tags && task.tags.length"
                class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant"
              >{{ task.tags[0] }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../store/taskStore'

const store = useTaskStore()

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const selectedDate = ref(null)

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const monthTasks = computed(() => {
  const tasks = store.state.tasks || []
  const year = currentYear.value
  const month = currentMonth.value
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}`
  return tasks.filter(t => t.dueDate && t.dueDate.startsWith(monthStart))
})

const calendarCells = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  let startWeekday = firstDay.getDay()
  startWeekday = startWeekday === 0 ? 6 : startWeekday - 1

  const prevMonthLastDay = new Date(year, month, 0).getDate()
  const cells = []
  const tasks = store.state.tasks || []
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const dateStr = formatDateStr(
      month === 0 ? year - 1 : year,
      month === 0 ? 11 : month - 1,
      day
    )
    cells.push({
      day,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      tasks: tasks.filter(t => t.dueDate === dateStr)
    })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateStr(year, month, d)
    cells.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      tasks: tasks.filter(t => t.dueDate === dateStr)
    })
  }

  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const dateStr = formatDateStr(
      month === 11 ? year + 1 : year,
      month === 11 ? 0 : month + 1,
      d
    )
    cells.push({
      day: d,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      tasks: tasks.filter(t => t.dueDate === dateStr)
    })
  }

  return cells
})

const selectedDateTasks = computed(() => {
  if (!selectedDate.value) return []
  const tasks = store.state.tasks || []
  return tasks.filter(t => t.dueDate === selectedDate.value)
})

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  const parts = selectedDate.value.split('-')
  const m = parseInt(parts[1], 10)
  const d = parseInt(parts[2], 10)
  const weekday = ['日', '一', '二', '三', '四', '五', '六']
  const date = new Date(parseInt(parts[0]), m - 1, d)
  return `${m}月${d}日 星期${weekday[date.getDay()]}`
})

function formatDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  selectedDate.value = null
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  selectedDate.value = null
}

function goToday() {
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth()
  selectedDate.value = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate())
}

function selectDate(cell) {
  selectedDate.value = cell.dateStr
}

function taskDotClass(task) {
  if (task.status === 'completed') return 'bg-tertiary-container/50 text-on-tertiary-container'
  const map = {
    high: 'bg-error-container/50 text-on-error-container',
    medium: 'bg-primary-container/50 text-on-primary-container',
    low: 'bg-surface-container-high text-on-surface-variant'
  }
  return map[task.priority] || map.medium
}

function priorityBorderClass(p) {
  return { high: 'border-error', medium: 'border-primary', low: 'border-slate-300' }[p] || 'border-primary'
}

function priorityBadgeClass(p) {
  return {
    high: 'bg-error-container text-on-error-container',
    medium: 'bg-primary-container text-on-primary-container',
    low: 'bg-surface-container-high text-on-surface-variant'
  }[p] || 'bg-primary-container text-on-primary-container'
}

function priorityLabel(p) {
  return { high: '高', medium: '中', low: '低' }[p] || '中'
}

async function seedSampleTasks() {
  const tasks = store.state.tasks || []
  if (tasks.length > 0) return

  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  const pad = (n) => String(n).padStart(2, '0')
  const ds = (offset) => {
    const date = new Date(y, m, d + offset)
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }

  const samples = [
    { title: '完成项目需求文档', description: '整理并提交 Q2 项目需求规格说明书', priority: 'high', dueDate: ds(0), tags: ['文档'] },
    { title: '团队周会', description: '讨论本周进展和下周计划', priority: 'medium', dueDate: ds(0), tags: ['会议'] },
    { title: '代码评审', description: '审查前端模块的 Pull Request', priority: 'medium', dueDate: ds(1), tags: ['开发'] },
    { title: '更新设计系统组件', description: '同步最新的 UI 组件库变更', priority: 'low', dueDate: ds(1), tags: ['设计'] },
    { title: '客户演示准备', description: '准备产品演示 PPT 和 Demo 环境', priority: 'high', dueDate: ds(2), tags: ['会议'] },
    { title: '修复登录页面 Bug', description: '解决用户反馈的登录异常问题', priority: 'high', dueDate: ds(2), tags: ['开发', '紧急'] },
    { title: '数据库优化方案', description: '编写数据库索引优化方案文档', priority: 'medium', dueDate: ds(3), tags: ['文档'] },
    { title: '新功能原型设计', description: '完成消息通知模块的交互原型', priority: 'medium', dueDate: ds(4), tags: ['设计'] },
    { title: '部署测试环境', description: '将最新代码部署到 Staging 服务器', priority: 'low', dueDate: ds(5), tags: ['开发'] },
    { title: '季度复盘会议', description: '回顾 Q1 成果并制定 Q2 OKR', priority: 'high', dueDate: ds(7), tags: ['会议'] },
    { title: '编写单元测试', description: '为核心业务模块补充测试用例', priority: 'medium', dueDate: ds(7), tags: ['开发'] },
    { title: '用户访谈', description: '与 5 位核心用户进行产品体验访谈', priority: 'high', dueDate: ds(9), tags: ['待审核'] },
    { title: '技术分享会', description: '分享微前端架构实践经验', priority: 'low', dueDate: ds(10), tags: ['会议'] },
    { title: '安全审计报告', description: '完成年度安全审计并提交报告', priority: 'high', dueDate: ds(-1), tags: ['文档', '紧急'] },
    { title: '优化首页加载速度', description: '将首页 LCP 降至 2s 以内', priority: 'medium', dueDate: ds(-2), tags: ['开发'] },
    { title: '整理项目文档', description: '归档历史项目文档到知识库', priority: 'low', dueDate: ds(12), tags: ['文档'] },
    { title: 'API 接口联调', description: '与后端完成新版 API 的联调测试', priority: 'high', dueDate: ds(5), tags: ['开发', '紧急'] },
    { title: '设计评审', description: '评审新版个人中心的设计方案', priority: 'medium', dueDate: ds(-3), tags: ['设计', '待审核'] },
    { title: '性能监控告警配置', description: '配置关键接口的响应时间告警阈值', priority: 'low', dueDate: ds(14), tags: ['开发'] },
    { title: '产品需求评审', description: '评审 V2.5 版本的新增功能需求', priority: 'high', dueDate: ds(3), tags: ['会议', '待审核'] }
  ]

  for (const s of samples) {
    await store.addTask(s)
  }

  const completedIds = [tasks.length - 1, tasks.length - 2].filter(i => i >= 0)
  for (const id of completedIds) {
    if (store.state.tasks[id]) {
      await store.toggleTaskStatus(store.state.tasks[id].id)
    }
  }
}

onMounted(async () => {
  await store.loadTasks()
  await seedSampleTasks()
  selectedDate.value = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate())
})
</script>
