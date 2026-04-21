<template>
  <div class="flex-1 flex flex-col overflow-hidden bg-surface">
    <div class="border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between bg-surface-variant/30">
      <div class="flex items-center gap-4">
        <button
          @click="$router.push('/projects')"
          class="p-2 hover:bg-outline-variant/10 rounded-lg transition-colors"
        >
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 class="text-xl font-bold text-on-surface">{{ project?.name || '项目详情' }}</h1>
          <span
            v-if="project"
            :class="[
              'inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1',
              statusClasses[project.status] || statusClasses.active
            ]"
          >
            {{ statusLabels[project.status] }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="handleEdit"
          class="p-2 hover:bg-outline-variant/10 rounded-lg transition-colors"
        >
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button
          @click="handleDelete"
          class="p-2 hover:bg-error/10 text-error rounded-lg transition-colors"
        >
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <span class="material-symbols-outlined text-4xl animate-spin text-primary mb-4 block">sync</span>
        <p class="text-on-surface-variant">加载中...</p>
      </div>
    </div>

    <div v-else-if="!project" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <span class="material-symbols-outlined text-6xl text-outline-variant mb-4 block">folder_off</span>
        <h2 class="text-xl font-bold text-on-surface mb-2">项目不存在</h2>
        <button
          @click="$router.push('/projects')"
          class="px-6 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          返回项目列表
        </button>
      </div>
    </div>

    <div v-else class="flex-1 overflow-y-auto p-6">
      <div class="max-w-5xl mx-auto space-y-6">
        <div class="grid grid-cols-4 gap-4">
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-symbols-outlined text-primary">task_alt</span>
              <span class="text-sm text-on-surface-variant">总任务</span>
            </div>
            <div class="text-2xl font-bold text-on-surface">{{ progress.total }}</div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-symbols-outlined text-success">check_circle</span>
              <span class="text-sm text-on-surface-variant">已完成</span>
            </div>
            <div class="text-2xl font-bold text-on-surface">{{ progress.completed }}</div>
            <div class="text-xs text-on-surface-variant">{{ progress.completionRate }}%</div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-symbols-outlined text-warning">pending</span>
              <span class="text-sm text-on-surface-variant">进行中</span>
            </div>
            <div class="text-2xl font-bold text-on-surface">{{ progress.inProgress }}</div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-symbols-outlined text-error">warning</span>
              <span class="text-sm text-on-surface-variant">逾期</span>
            </div>
            <div class="text-2xl font-bold text-on-surface">{{ progress.overdue }}</div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h3 class="text-lg font-bold text-on-surface mb-4">项目信息</h3>
          <div class="space-y-4">
            <div v-if="project.description">
              <label class="block text-sm font-medium text-on-surface-variant mb-1">描述</label>
              <p class="text-on-surface">{{ project.description }}</p>
            </div>
            <div v-if="project.startDate || project.dueDate">
              <label class="block text-sm font-medium text-on-surface-variant mb-1">时间范围</label>
              <p class="text-on-surface">
                {{ project.startDate || '未设定' }} → {{ project.dueDate || '未设定' }}
              </p>
            </div>
            <div v-if="project.tags.length > 0">
              <label class="block text-sm font-medium text-on-surface-variant mb-2">标签</label>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(tag, index) in project.tags"
                  :key="index"
                  class="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-md text-sm"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <GanttChart
          :tasks="projectTasks"
          @taskClick="handleTaskClick"
        />

        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-on-surface">项目任务</h3>
            <button
              @click="handleAddTask"
              class="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-sm">add</span>
              <span>添加任务</span>
            </button>
          </div>

          <div v-if="projectTasks.length === 0" class="text-center py-8">
            <span class="material-symbols-outlined text-4xl text-outline-variant mb-4 block">assignment</span>
            <p class="text-on-surface-variant">暂无任务</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="task in projectTasks"
              :key="task.id"
              class="p-4 bg-surface-variant dark:bg-slate-700 rounded-lg flex items-center gap-4 hover:bg-surface-variant/80 transition-colors cursor-pointer"
              @click="handleTaskClick(task)"
            >
              <button
                @click.stop="toggleTaskStatus(task)"
                :class="[
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                  task.status === 'completed'
                    ? 'bg-success border-success text-white'
                    : 'border-outline-variant hover:border-success'
                ]"
              >
                <span v-if="task.status === 'completed'" class="material-symbols-outlined text-sm">check</span>
              </button>
              <div class="flex-1">
                <h4
                  :class="[
                    'font-medium',
                    task.status === 'completed' ? 'text-on-surface-variant line-through' : 'text-on-surface'
                  ]"
                >
                  {{ task.title }}
                </h4>
                <p v-if="task.description" class="text-sm text-on-surface-variant mt-1 line-clamp-1">{{ task.description }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span
                  v-if="task.dueDate"
                  :class="[
                    'text-xs px-2 py-1 rounded-md',
                    isTaskOverdue(task) ? 'bg-error/10 text-error' : 'bg-outline-variant/10 text-on-surface-variant'
                  ]"
                >
                  {{ task.dueDate }}
                </span>
                <span
                  :class="[
                    'material-symbols-outlined text-sm',
                    task.priority === 'high' ? 'text-error' : task.priority === 'medium' ? 'text-warning' : 'text-success'
                  ]"
                >
                  {{ task.priority === 'high' ? 'priority_high' : task.priority === 'medium' ? 'star' : 'priority_low' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ProjectModal
      :is-open="showModal"
      :project="editingProject"
      @close="closeModal"
      @submit="handleProjectSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../store/projectStore'
import { useTaskStore } from '../store/taskStore'
import ProjectModal from '../components/ProjectModal.vue'
import GanttChart from '../components/GanttChart.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()

const loading = ref(true)
const showModal = ref(false)
const editingProject = ref(null)

const projectId = computed(() => route.params.id)

const project = computed(() => {
  return projectStore.getProjectById(projectId.value)
})

const projectTasks = computed(() => {
  return taskStore.getTasksByProject(projectId.value)
})

const progress = computed(() => {
  return projectStore.getProjectProgress(projectId.value, taskStore.state.tasks)
})

const statusLabels = {
  active: '进行中',
  paused: '已暂停',
  completed: '已完成',
  archived: '已归档'
}

const statusClasses = {
  active: 'bg-success/10 text-success',
  paused: 'bg-warning/10 text-warning',
  completed: 'bg-primary/10 text-primary',
  archived: 'bg-outline-variant/10 text-on-surface-variant'
}

onMounted(async () => {
  await projectStore.loadProjects()
  await taskStore.loadTasks()
  loading.value = false
})

watch(projectId, async () => {
  loading.value = true
  await projectStore.loadProjects()
  await taskStore.loadTasks()
  loading.value = false
})

function isTaskOverdue(task) {
  if (!task.dueDate || task.status === 'completed') return false
  const today = new Date().toISOString().split('T')[0]
  return task.dueDate < today
}

function handleEdit() {
  editingProject.value = project.value
  showModal.value = true
}

function handleDelete() {
  if (confirm('确定要删除这个项目吗？')) {
    projectStore.deleteProject(projectId.value)
    router.push('/projects')
  }
}

function handleProjectSubmit(projectData) {
  if (projectData.id) {
    projectStore.updateProject(projectData.id, projectData)
  }
  closeModal()
}

function closeModal() {
  showModal.value = false
  editingProject.value = null
}

function handleAddTask() {
  router.push(`/my-tasks?projectId=${projectId.value}`)
}

function handleTaskClick(task) {
  router.push(`/my-tasks?taskId=${task.id}`)
}

async function toggleTaskStatus(task) {
  const newStatus = task.status === 'completed' ? 'pending' : 'completed'
  await taskStore.updateTask(task.id, { status: newStatus })
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
