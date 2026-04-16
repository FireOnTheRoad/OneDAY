<template>
  <section class="w-1/2 h-full overflow-y-auto px-8 py-8 bg-surface border-r border-surface-container">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-3xl font-extrabold text-on-surface headline tracking-tight">专注流</h2>
        <p class="text-on-surface-variant font-medium text-sm mt-1">你今天有 {{ sortedTasks.length }} 个优先任务。</p>
        <p class="text-on-surface-variant/60 text-xs mt-1">按紧急程度排序</p>
      </div>
      <div class="flex gap-2">
        <button class="p-2 bg-surface-container-high rounded-lg hover:bg-surface-variant transition-colors">
          <span class="material-symbols-outlined">filter_list</span>
        </button>
        <button class="p-2 bg-surface-container-high rounded-lg hover:bg-surface-variant transition-colors">
          <span class="material-symbols-outlined">sort</span>
        </button>
      </div>
    </div>

    <div v-if="store.state.loading" class="flex items-center justify-center py-20">
      <span class="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
    </div>

    <div v-else-if="sortedTasks.length === 0" class="flex flex-col items-center justify-center py-20">
      <span class="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">checklist</span>
      <h3 class="text-lg font-bold text-on-surface-variant mb-1">暂无待办事项</h3>
      <p class="text-sm text-on-surface-variant/60">点击右上角"添加"按钮创建新任务</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="task in sortedTasks"
        :key="task.id"
        data-testid="task-item"
        :class="[
          'group relative bg-surface-container-lowest p-5 rounded-2xl shadow-sm border-l-4 hover:shadow-md transition-all',
          priorityBorderClass(task.priority),
          task.status === 'completed' ? 'opacity-60' : ''
        ]"
      >
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-3">
            <span
              :class="['material-symbols-outlined', priorityIconColor(task.priority, task.status)]"
              :style="task.status === 'completed' ? 'font-variation-settings: \'FILL\' 1;' : ''"
            >{{ taskIcon(task.priority, task.status) }}</span>
            <h3 :class="['font-bold text-on-surface', task.status === 'completed' ? 'line-through' : '']">{{ task.title }}</h3>
          </div>
          <span
            v-if="taskBadge(task)"
            :class="['text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider', taskBadgeClass(task)]"
          >{{ taskBadge(task) }}</span>
        </div>

        <p v-if="task.description" class="text-on-surface-variant text-sm line-clamp-2">{{ task.description }}</p>

        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-center gap-4 text-xs text-on-surface-variant">
            <div v-if="task.dueDate" class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">event</span>
              <span>{{ formatDueDate(task.dueDate) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useTaskStore } from '@/store/taskStore'

const store = useTaskStore()

// 加载任务数据
onMounted(async () => {
  if (!store.state.initialized && !store.state.loading) {
    await store.loadTasks()
  }
})

// 计算属性：按紧急程度排序的任务
const sortedTasks = computed(() => {
  const tasks = store.state.tasks.filter(t => t.status !== 'completed' && t.status !== 'archived')
  const now = new Date().toISOString().split('T')[0]
  
  // 排序算法：已过期任务排在最前面，按过期时间从远到近；未过期任务按deadline从近到远
  return tasks.sort((a, b) => {
    // 处理没有dueDate的情况
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1 // 没有截止日期的排在后面
    if (!b.dueDate) return -1 // 有截止日期的排在前面
    
    const aOverdue = a.dueDate < now
    const bOverdue = b.dueDate < now
    
    // 已过期任务 vs 未过期任务
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    
    // 都是已过期任务：按过期时间从远到近
    if (aOverdue && bOverdue) {
      return a.dueDate.localeCompare(b.dueDate)
    }
    
    // 都是未过期任务：按截止时间从近到远
    return a.dueDate.localeCompare(b.dueDate)
  })
})

// 辅助函数：获取优先级对应的边框类
function priorityBorderClass(priority) {
  const classes = {
    high: 'border-error',
    medium: 'border-primary',
    low: 'border-tertiary'
  }
  return classes[priority] || 'border-slate-300'
}

// 辅助函数：获取优先级对应的图标颜色
function priorityIconColor(priority, status) {
  if (status === 'completed') {
    return 'text-tertiary'
  }
  const colors = {
    high: 'text-error',
    medium: 'text-primary',
    low: 'text-tertiary'
  }
  return colors[priority] || 'text-on-surface-variant'
}

// 辅助函数：获取任务图标
function taskIcon(priority, status) {
  if (status === 'completed') {
    return 'check_circle'
  }
  const icons = {
    high: 'priority_high',
    medium: 'schedule',
    low: 'radio_button_unchecked'
  }
  return icons[priority] || 'radio_button_unchecked'
}

// 辅助函数：获取任务徽章文本
function taskBadge(task) {
  if (task.status === 'completed') {
    return '已完成'
  }
  
  if (!task.dueDate) {
    return null
  }
  
  const now = new Date()
  const dueDate = new Date(task.dueDate)
  const diffTime = dueDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return '已逾期'
  } else if (diffDays === 0) {
    return '今天到期'
  } else if (diffDays === 1) {
    return '明天到期'
  } else if (diffDays < 7) {
    return `${diffDays}天后到期`
  }
  
  return null
}

// 辅助函数：获取任务徽章类
function taskBadgeClass(task) {
  if (task.status === 'completed') {
    return 'bg-tertiary-fixed text-on-tertiary-fixed'
  }
  
  if (!task.dueDate) {
    return ''
  }
  
  const now = new Date()
  const dueDate = new Date(task.dueDate)
  const diffTime = dueDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return 'bg-error-container text-on-error-container'
  } else if (diffDays === 0) {
    return 'bg-primary-container text-on-primary-container'
  } else if (diffDays === 1) {
    return 'bg-primary-container text-on-primary-container'
  } else if (diffDays < 7) {
    return 'bg-primary-container text-on-primary-container'
  }
  
  return ''
}

// 辅助函数：格式化截止日期
function formatDueDate(dueDate) {
  const now = new Date()
  const date = new Date(dueDate)
  const diffTime = date - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return '已逾期'
  } else if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '明天'
  } else if (diffDays < 7) {
    return `${diffDays}天后`
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}
</script>
