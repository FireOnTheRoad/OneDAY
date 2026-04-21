<template>
  <div class="flex-1 flex flex-col overflow-hidden bg-surface">
    <div class="border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between bg-surface-variant/30">
      <div class="flex items-center gap-4 flex-1">
        <div class="relative flex-1 max-w-md">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索项目..."
            class="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant/50"
          >
        </div>
      </div>
      <button
        @click="handleCreate"
        class="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg"
      >
        <span class="material-symbols-outlined text-sm">add</span>
        <span>新建项目</span>
      </button>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <span class="material-symbols-outlined text-4xl animate-spin text-primary mb-4 block">sync</span>
        <p class="text-on-surface-variant">加载中...</p>
      </div>
    </div>

    <div v-else-if="filteredProjects.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <span class="material-symbols-outlined text-6xl text-outline-variant mb-4 block">folder_open</span>
        <h2 class="text-xl font-bold text-on-surface mb-2">
          {{ searchQuery ? '未找到匹配的项目' : '还没有项目' }}
        </h2>
        <p class="text-on-surface-variant mb-4">
          {{ searchQuery ? '试试其他关键词' : '创建你的第一个项目开始管理工作' }}
        </p>
        <button
          v-if="!searchQuery"
          @click="handleCreate"
          class="px-6 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          创建第一个项目
        </button>
      </div>
    </div>

    <div v-else class="flex-1 overflow-y-auto p-6">
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProjectCard
            v-for="project in filteredProjects"
            :key="project.id"
            :project="project"
            :progress="getProjectProgress(project.id)"
            @click="handleClick"
            @edit="handleEdit"
            @delete="handleDelete"
          />
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../store/projectStore'
import { useTaskStore } from '../store/taskStore'
import ProjectCard from '../components/ProjectCard.vue'
import ProjectModal from '../components/ProjectModal.vue'

const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()

const loading = ref(true)
const searchQuery = ref('')
const showModal = ref(false)
const editingProject = ref(null)

const filteredProjects = computed(() => {
  if (!searchQuery.value.trim()) {
    return projectStore.state.projects
  }
  const query = searchQuery.value.toLowerCase()
  return projectStore.state.projects.filter(project =>
    project.name.toLowerCase().includes(query) ||
    (project.description && project.description.toLowerCase().includes(query)) ||
    project.tags.some(tag => tag.toLowerCase().includes(query))
  )
})

onMounted(async () => {
  await projectStore.loadProjects()
  await taskStore.loadTasks()
  loading.value = false
})

function getProjectProgress(projectId) {
  return projectStore.getProjectProgress(projectId, taskStore.state.tasks)
}

function handleClick(projectId) {
  router.push(`/projects/${projectId}`)
}

function handleCreate() {
  editingProject.value = null
  showModal.value = true
}

function handleEdit(project) {
  editingProject.value = project
  showModal.value = true
}

function handleDelete(project) {
  if (confirm(`确定要删除项目 "${project.name}" 吗？`)) {
    projectStore.deleteProject(project.id)
  }
}

function handleProjectSubmit(projectData) {
  if (projectData.id) {
    projectStore.updateProject(projectData.id, projectData)
  } else {
    projectStore.addProject(projectData)
  }
  closeModal()
}

function closeModal() {
  showModal.value = false
  editingProject.value = null
}
</script>

