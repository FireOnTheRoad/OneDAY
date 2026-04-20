import { reactive, readonly } from 'vue'

const state = reactive({
  records: [],
  loading: false,
  error: null,
  initialized: false,
  // 计时器状态
  timerState: {
    running: false,
    paused: false,
    startTime: null,
    elapsedSeconds: 0,
    pausedAt: null,
    totalPausedSeconds: 0,
    taskId: null
  },
  timerTaskTitle: ''
})

// 计算属性
function getTimerDisplay() {
  const total = state.timerState.elapsedSeconds
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

async function loadRecords() {
  state.loading = true
  state.error = null
  try {
    if (window.electronAPI?.readTimeRecords) {
      const data = await window.electronAPI.readTimeRecords()
      state.records = data.records || []
    } else {
      // 开发环境下使用模拟数据
      state.records = []
    }
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
    if (window.electronAPI?.writeTimeRecords) {
      const data = {
        version: 1,
        lastUpdated: new Date().toISOString(),
        records: JSON.parse(JSON.stringify(state.records))
      }
      const result = await window.electronAPI.writeTimeRecords(data)
      if (!result.success) {
        state.error = '保存时间记录失败: ' + (result.error || '未知错误')
      }
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
    taskId: recordData.taskId || null,
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

function getRecordsGroupedByDate() {
  const grouped = {}
  
  state.records.forEach(record => {
    const start = new Date(record.startTime)
    const pad = (n) => String(n).padStart(2, '0')
    const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
    
    if (!grouped[dateStr]) {
      grouped[dateStr] = []
    }
    
    grouped[dateStr].push(record)
  })
  
  // 按日期排序，最近的日期在前面
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))
  
  const result = []
  sortedDates.forEach(date => {
    result.push({
      date,
      records: grouped[date].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)) // 按开始时间排序
    })
  })
  
  return result
}

function getDateRangeRecords(startDate, endDate) {
  return state.records.filter(record => {
    const recordDate = new Date(record.startTime).toISOString().split('T')[0]
    return recordDate >= startDate && recordDate <= endDate
  })
}

// 获取任务的工作时间（秒）
function getTaskWorkTime(taskId) {
  if (!taskId) return 0
  return state.records
    .filter(record => record.taskId === taskId)
    .reduce((sum, record) => sum + (record.durationSeconds || 0), 0)
}

export function useTimeRecordStore() {
  if (!state.initialized && !state.loading) {
    loadRecords()
  }

  return {
    state: readonly(state),
    timerState: state.timerState,
    timerTaskTitle: state.timerTaskTitle,
    timerDisplay: getTimerDisplay(),
    loadRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByDate,
    getTodayRecords,
    getTodayTotalSeconds,
    getRecordsGroupedByDate,
    getDateRangeRecords,
    getTaskWorkTime
  }
}
