/**
 * 项目数据服务层
 *
 * 提供响应式的项目数据管理，通过 Electron IPC 与主进程通信，
 * 实现数据的持久化存储和读取。
 *
 * 使用方式：
 *   import { useProjectProjectStore } from '@/store/projectStore'
 *   const store = useProjectStore()
 *   await store.loadProjects()
 *   store.addProject({ name: '新项目', priority: 'high' })
 */

import { reactive, readonly } from 'vue'

const state = reactive({
  projects: [],
  loading: false,
  error: null,
  initialized: false
})

/**
 * 生成唯一 ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

/**
 * 从主进程加载项目数据
 */
async function loadProjects() {
  state.loading = true
  state.error = null
  try {
    if (window.electronAPI?.readProjects) {
      const data = await window.electronAPI.readProjects()
      state.projects = data.projects || []
    } else {
      state.projects = []
    }
    state.initialized = true
  } catch (err) {
    state.error = '加载项目数据失败: ' + err.message
    console.error('[ProjectStore] 加载失败:', err)
  } finally {
    state.loading = false
  }
}

/**
 * 将当前项目数据持久化到主进程
 */
async function saveProjects() {
  try {
    if (window.electronAPI?.writeProjects) {
      const data = {
        version: 1,
        lastUpdated: new Date().toISOString(),
        projects: JSON.parse(JSON.stringify(state.projects))
      }
      const result = await window.electronAPI.writeProjects(data)
      if (!result.success) {
        state.error = '保存项目数据失败: ' + (result.error || '未知错误')
        console.error('[ProjectStore] 保存失败:', result.error)
      }
    }
  } catch (err) {
    state.error = '保存项目数据失败: ' + err.message
    console.error('[ProjectStore] 保存异常:', err)
  }
}

/**
 * 添加新项目
 * @param {Object} projectData - 项目数据
 * @param {string} projectData.name - 项目名称（必填）
 * @param {string} [projectData.description] - 项目描述
 * @param {string} [projectData.priority] - 优先级: high/medium/low
 * @param {string} [projectData.startDate] - 开始日期 YYYY-MM-DD
 * @param {string} [projectData.dueDate] - 截止日期 YYYY-MM-DD
 * @param {string[]} [projectData.tags] - 标签列表
 */
async function addProject(projectData) {
  const now = new Date().toISOString()
  const newProject = {
    id: generateId(),
    name: projectData.name || '',
    description: projectData.description || '',
    status: 'active',
    priority: projectData.priority || 'medium',
    startDate: projectData.startDate || null,
    dueDate: projectData.dueDate || null,
    tags: projectData.tags || [],
    createdAt: now,
    updatedAt: now
  }

  state.projects.unshift(newProject)
  await saveProjects()
  return newProject
}

/**
 * 更新项目
 * @param {string} id - 项目 ID
 * @param {Object} updates - 需要更新的字段
 */
async function updateProject(id, updates) {
  const index = state.projects.findIndex(p => p.id === id)
  if (index === -1) {
    console.warn('[ProjectStore] 未找到项目:', id)
    return null
  }

  state.projects[index] = {
    ...state.projects[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }

  await saveProjects()
  return state.projects[index]
}

/**
 * 删除项目
 * @param {string} id - 项目 ID
 */
async function deleteProject(id) {
  const index = state.projects.findIndex(p => p.id === id)
  if (index === -1) return false

  state.projects.splice(index, 1)
  await saveProjects()
  return true
}

/**
 * 获取项目
 * @param {string} id - 项目 ID
 */
function getProjectById(id) {
  return state.projects.find(p => p.id === id)
}

/**
 * 获取指定状态的项目
 * @param {string} status - 项目状态
 */
function getProjectsByStatus(status) {
  return state.projects.filter(p => p.status === status)
}

/**
 * 计算项目进度
 * @param {string} projectId - 项目 ID
 * @param {Array} tasks - 任务列表
 */
function getProjectProgress(projectId, tasks = []) {
  const projectTasks = tasks.filter(t => t.projectId === projectId)
  if (projectTasks.length === 0) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      overdue: 0,
      completionRate: 0
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const completed = projectTasks.filter(t => t.status === 'completed').length
  const inProgress = projectTasks.filter(t => t.status === 'in_progress').length
  const pending = projectTasks.filter(t => t.status === 'pending').length
  const overdue = projectTasks.filter(t =>
    t.dueDate &&
    t.dueDate < today &&
    t.status !== 'completed'
  ).length

  return {
    total: projectTasks.length,
    completed,
    inProgress,
    pending,
    overdue,
    completionRate: Math.round((completed / projectTasks.length) * 100)
  }
}

export function useProjectStore() {
  if (!state.initialized && !state.loading) {
    loadProjects()
  }

  return {
    state: readonly(state),
    loadProjects,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectsByStatus,
    getProjectProgress
  }
}
