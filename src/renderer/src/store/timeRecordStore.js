import { reactive, readonly } from 'vue'

const state = reactive({
  records: [],
  loading: false,
  error: null,
  initialized: false
})

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

async function loadRecords() {
  state.loading = true
  state.error = null
  try {
    const data = await window.electronAPI.readTimeRecords()
    state.records = data.records || []
    state.initialized = true
  } catch (err) {
    state.error = '加载时间记录失败: ' + err.message
    console.error('[TimeRecordStore] 加载失败:', err)
  } finally {
    state.loading = false
  }
}

async function saveRecords() {
  try {
    const data = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      records: state.records
    }
    const result = await window.electronAPI.writeTimeRecords(data)
    if (!result.success) {
      state.error = '保存时间记录失败: ' + (result.error || '未知错误')
    }
  } catch (err) {
    state.error = '保存时间记录失败: ' + err.message
    console.error('[TimeRecordStore] 保存异常:', err)
  }
}

async function addRecord(recordData) {
  const newRecord = {
    id: generateId(),
    taskTitle: recordData.taskTitle || '',
    startTime: recordData.startTime,
    endTime: recordData.endTime,
    durationSeconds: recordData.durationSeconds || 0,
    createdAt: new Date().toISOString()
  }

  state.records.unshift(newRecord)
  await saveRecords()
  return newRecord
}

async function updateRecord(id, updates) {
  const index = state.records.findIndex(r => r.id === id)
  if (index === -1) return null

  state.records[index] = { ...state.records[index], ...updates }
  await saveRecords()
  return state.records[index]
}

async function deleteRecord(id) {
  const index = state.records.findIndex(r => r.id === id)
  if (index === -1) return false

  state.records.splice(index, 1)
  await saveRecords()
  return true
}

function getRecordsByDate(dateStr) {
  return state.records.filter(r => {
    const start = new Date(r.startTime)
    const pad = (n) => String(n).padStart(2, '0')
    const recDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
    return recDate === dateStr
  })
}

function getTodayRecords() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return getRecordsByDate(todayStr)
}

function getTodayTotalSeconds() {
  return getTodayRecords().reduce((sum, r) => sum + (r.durationSeconds || 0), 0)
}

export function useTimeRecordStore() {
  if (!state.initialized && !state.loading) {
    loadRecords()
  }

  return {
    state: readonly(state),
    loadRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByDate,
    getTodayRecords,
    getTodayTotalSeconds
  }
}
