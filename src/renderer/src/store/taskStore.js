/**
 * 任务数据服务层
 *
 * 提供响应式的任务数据管理，通过 Electron IPC 与主进程通信，
 * 实现数据的持久化存储和读取。
 *
 * 使用方式：
 *   import { useTaskStore } from '@/store/taskStore'
 *   const store = useTaskStore()
 *   await store.loadTasks()
 *   store.addTask({ title: '新任务', priority: 'high' })
 */

import { reactive, readonly } from 'vue'

const state = reactive({
  tasks: [],
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
 * 从主进程加载任务数据
 */
async function loadTasks() {
  state.loading = true
  state.error = null
  try {
    if (window.electronAPI?.readTasks) {
      const data = await window.electronAPI.readTasks()
      state.tasks = data.tasks || []
    } else {
      state.tasks = []
    }
    state.initialized = true
  } catch (err) {
    state.error = '加载任务数据失败: ' + err.message
    console.error('[TaskStore] 加载失败:', err)
  } finally {
    state.loading = false
  }
}

/**
 * 将当前任务数据持久化到主进程
 * 写入前自动触发备份
 */
async function saveTasks() {
  try {
    if (window.electronAPI?.writeTasks) {
      const data = {
        version: 1,
        lastUpdated: new Date().toISOString(),
        tasks: JSON.parse(JSON.stringify(state.tasks))
      }
      const result = await window.electronAPI.writeTasks(data)
      if (!result.success) {
        state.error = '保存任务数据失败: ' + (result.error || '未知错误')
        console.error('[TaskStore] 保存失败:', result.error)
      }
    }
  } catch (err) {
    state.error = '保存任务数据失败: ' + err.message
    console.error('[TaskStore] 保存异常:', err)
  }
}

/**
 * 添加新任务
 * @param {Object} taskData - 任务数据
 * @param {string} taskData.title - 任务标题（必填）
 * @param {string} [taskData.description] - 任务描述
 * @param {string} [taskData.priority] - 优先级: high/medium/low
 * @param {string} [taskData.dueDate] - 截止日期 YYYY-MM-DD
 * @param {string[]} [taskData.tags] - 标签列表
 */
async function addTask(taskData) {
  const now = new Date().toISOString()
  const newTask = {
    id: generateId(),
    title: taskData.title || '',
    description: taskData.description || '',
    priority: taskData.priority || 'medium',
    status: 'pending',
    dueDate: taskData.dueDate || null,
    createdAt: now,
    updatedAt: now,
    tags: taskData.tags || []
  }

  state.tasks.unshift(newTask)
  await saveTasks()
  return newTask
}

/**
 * 更新任务
 * @param {string} id - 任务 ID
 * @param {Object} updates - 需要更新的字段
 */
async function updateTask(id, updates) {
  const index = state.tasks.findIndex(t => t.id === id)
  if (index === -1) {
    console.warn('[TaskStore] 未找到任务:', id)
    return null
  }

  state.tasks[index] = {
    ...state.tasks[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }

  await saveTasks()
  return state.tasks[index]
}

/**
 * 删除任务
 * @param {string} id - 任务 ID
 */
async function deleteTask(id) {
  const index = state.tasks.findIndex(t => t.id === id)
  if (index === -1) return false

  state.tasks.splice(index, 1)
  await saveTasks()
  return true
}

/**
 * 切换任务完成状态
 * @param {string} id - 任务 ID
 */
async function toggleTaskStatus(id) {
  const task = state.tasks.find(t => t.id === id)
  if (!task) return null

  const newStatus = task.status === 'completed' ? 'pending' : 'completed'
  return updateTask(id, { status: newStatus })
}

/**
 * 获取指定状态的任务
 * @param {string} status - 任务状态
 */
function getTasksByStatus(status) {
  return state.tasks.filter(t => t.status === status)
}

/**
 * 获取待办任务（未完成且未归档）
 */
function getPendingTasks() {
  return state.tasks.filter(t => t.status !== 'completed' && t.status !== 'archived')
}

/**
 * 获取已逾期任务
 */
function getOverdueTasks() {
  const today = new Date().toISOString().split('T')[0]
  return state.tasks.filter(t =>
    t.dueDate &&
    t.dueDate < today &&
    t.status !== 'completed' &&
    t.status !== 'archived'
  )
}

// 获取任务的工作时间（秒）
function getTaskWorkTime(taskId) {
  // 这里需要导入timeRecordStore来获取记录
  // 由于循环依赖问题，我们暂时返回0，实际使用时需要从timeRecordStore获取
  return 0
}

// 格式化工作时间为 h m 格式
function formatWorkTime(seconds) {
  if (!seconds || seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function useTaskStore() {
  if (!state.initialized && !state.loading) {
    loadTasks()
  }

  return {
    state: readonly(state),
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    getTasksByStatus,
    getPendingTasks,
    getOverdueTasks,
    getTaskWorkTime,
    formatWorkTime
  }
}
