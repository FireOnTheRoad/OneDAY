<template>
  <div class="flex-1 flex flex-col bg-surface overflow-hidden">
    <div class="px-8 py-6 border-b border-surface-container">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-extrabold text-on-surface headline tracking-tight">待办事项</h2>
          <p class="text-on-surface-variant font-medium text-sm mt-1">
            共 {{ pendingCount }} 项待办
            <span v-if="overdueCount > 0" class="text-error font-bold ml-2">{{ overdueCount }} 项已逾期</span>
          </p>
        </div>
        <div class="flex gap-2">
          <button
            v-for="f in filterOptions"
            :key="f.value"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
              activeFilter === f.value
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            ]"
            @click="activeFilter = f.value"
          >
            {{ f.label }}
          </button>
          <button
            class="flex items-center gap-2 bg-primary text-on-primary px-4 py-1.5 rounded-xl font-semibold shadow-sm hover:opacity-90 active:scale-95 duration-150 transition-all"
            @click="showAddModal = true"
          >
            <span class="material-symbols-outlined text-sm">add</span>
            <span class="text-xs">添加</span>
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-8 py-6">
      <div v-if="store.state.loading" class="flex items-center justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
      </div>

      <div v-else-if="filteredTasks.length === 0" class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">checklist</span>
        <h3 class="text-lg font-bold text-on-surface-variant mb-1">暂无待办事项</h3>
        <p class="text-sm text-on-surface-variant/60">点击右上角"添加"按钮创建新任务</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          :class="[
            'group relative bg-surface-container-lowest p-5 rounded-2xl shadow-sm border-l-4 hover:shadow-md transition-all',
            priorityBorderClass(task.priority),
            task.status === 'completed' ? 'opacity-60' : ''
          ]"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-3">
              <button
                class="p-0.5 hover:scale-110 transition-transform"
                @click="handleToggleStatus(task)"
              >
                <span
                  :class="['material-symbols-outlined text-lg', task.status === 'completed' ? 'text-tertiary' : priorityIconClass(task.priority)]"
                  :style="task.status === 'completed' ? 'font-variation-settings: \'FILL\' 1;' : ''"
                >{{ task.status === 'completed' ? 'check_circle' : 'radio_button_unchecked' }}</span>
              </button>
              <h3 :class="['font-bold text-on-surface', task.status === 'completed' ? 'line-through' : '']">{{ task.title }}</h3>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="isOverdue(task)"
                class="bg-error-container text-on-error-container text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"
              >已逾期</span>
              <span
                v-else-if="task.status === 'completed'"
                class="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"
              >已完成</span>
              <button
                class="p-1 opacity-0 group-hover:opacity-100 hover:bg-surface-container-high rounded-lg transition-all"
                @click="handleEditTask(task)"
              >
                <span class="material-symbols-outlined text-sm text-on-surface-variant">edit</span>
              </button>
              <button
                class="p-1 opacity-0 group-hover:opacity-100 hover:bg-error-container/30 rounded-full transition-all"
                @click="handleDelete(task.id)"
              >
                <span class="material-symbols-outlined text-sm text-error">delete</span>
              </button>
            </div>
          </div>

          <p v-if="task.description" class="text-on-surface-variant text-sm ml-8 mb-3 line-clamp-2">{{ task.description }}</p>

          <div class="ml-8 flex items-center justify-between">
            <div class="flex items-center gap-4 text-xs text-on-surface-variant">
              <div v-if="task.dueDate" class="flex items-center gap-1" :class="isOverdue(task) ? 'text-error font-bold' : ''">
                <span class="material-symbols-outlined text-sm">event</span>
                <span>{{ formatDate(task.dueDate) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">flag</span>
                <span>{{ priorityLabel(task.priority) }}</span>
              </div>
            </div>
            <div v-if="task.tags && task.tags.length" class="flex gap-1.5">
              <span
                v-for="tag in task.tags"
                :key="tag"
                class="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full"
              >{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AddTaskModal
      :visible="showAddModal"
      @close="showAddModal = false"
      @submit="handleAddTask"
    />
    <EditTaskModal
      :visible="showEditModal"
      :task="editingTask"
      @close="closeEditModal"
      @submit="handleUpdateTask"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../store/taskStore'
import AddTaskModal from '../components/AddTaskModal.vue'
import EditTaskModal from '../components/EditTaskModal.vue'

const store = useTaskStore()
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingTask = ref(null)
const activeFilter = ref('all')

const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待办' },
  { value: 'completed', label: '已完成' },
  { value: 'overdue', label: '已逾期' }
]

const pendingCount = computed(() => store.getPendingTasks().length)
const overdueCount = computed(() => store.getOverdueTasks().length)

const filteredTasks = computed(() => {
  const tasks = store.state.tasks || []
  switch (activeFilter.value) {
    case 'pending':
      return tasks.filter(t => t.status === 'pending' || t.status === 'in_progress')
    case 'completed':
      return tasks.filter(t => t.status === 'completed')
    case 'overdue':
      return store.getOverdueTasks()
    default:
      return tasks.filter(t => t.status !== 'archived')
  }
})

function isOverdue(task) {
  if (!task.dueDate || task.status === 'completed') return false
  return task.dueDate < new Date().toISOString().split('T')[0]
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return '今天'
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) return '明天'
  return `${month}月${day}日`
}

function priorityLabel(p) {
  return { high: '高优先', medium: '中优先', low: '低优先' }[p] || '中优先'
}

function priorityBorderClass(p) {
  return { high: 'border-error', medium: 'border-primary', low: 'border-slate-300' }[p] || 'border-primary'
}

function priorityIconClass(p) {
  return { high: 'text-error', medium: 'text-primary', low: 'text-on-surface-variant' }[p] || 'text-primary'
}

async function handleAddTask(taskData) {
  await store.addTask(taskData)
  showAddModal.value = false
}

function handleEditTask(task) {
  editingTask.value = task
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingTask.value = null
}

async function handleUpdateTask(taskData) {
  await store.updateTask(taskData.id, taskData)
  closeEditModal()
}

async function handleToggleStatus(task) {
  await store.toggleTaskStatus(task.id)
}

async function handleDelete(id) {
  await store.deleteTask(id)
}

onMounted(() => {
  store.loadTasks()
})
</script>
