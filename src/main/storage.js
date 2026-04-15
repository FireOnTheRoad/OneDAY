/**
 * 数据存储模块
 *
 * 负责管理应用数据的 JSON 文件读写、验证和备份。
 *
 * 文件夹组织结构：
 *   {userData}/OneDAY/
 *   ├── data/                    # 数据目录
 *   │   ├── tasks.json           # 任务数据
 *   │   ├── settings.json        # 用户设置
 *   │   └── timeRecords.json     # 时间记录数据
 *   └── backups/                 # 备份目录
 *       ├── tasks/               # 任务数据备份
 *       └── timeRecords/         # 时间记录备份
 *
 * tasks.json 数据格式：
 *   {
 *     "version": 1,
 *     "lastUpdated": "ISO8601时间戳",
 *     "tasks": [
 *       {
 *         "id": "uuid",
 *         "title": "任务名称",
 *         "description": "任务描述",
 *         "priority": "high|medium|low",
 *         "status": "pending|in_progress|completed|archived",
 *         "dueDate": "YYYY-MM-DD",
 *         "createdAt": "ISO8601时间戳",
 *         "updatedAt": "ISO8601时间戳",
 *         "tags": ["标签1", "标签2"]
 *       }
 *     ]
 *   }
 *
 * timeRecords.json 数据格式：
 *   {
 *     "version": 1,
 *     "lastUpdated": "ISO8601时间戳",
 *     "records": [
 *       {
 *         "id": "uuid",
 *         "taskTitle": "正在进行的任务内容（必填）",
 *         "startTime": "ISO8601时间戳",
 *         "endTime": "ISO8601时间戳",
 *         "durationSeconds": 3600,           // 持续秒数
 *         "createdAt": "ISO8601时间戳"
 *       }
 *     ]
 *   }
 *
 * settings.json 数据格式：
 *   {
 *     "version": 1,
 *     "lastUpdated": "ISO8601时间戳",
 *     "theme": "light|dark",
 *     "language": "zh-CN"
 *   }
 */

import { app, ipcMain } from 'electron'
import { join, dirname } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync, unlinkSync } from 'fs'

const APP_DATA_DIR = join(app.getPath('userData'), 'OneDAY')
const DATA_DIR = join(APP_DATA_DIR, 'data')
const BACKUP_DIR = join(APP_DATA_DIR, 'backups')
const TASKS_BACKUP_DIR = join(BACKUP_DIR, 'tasks')
const TIME_RECORDS_BACKUP_DIR = join(BACKUP_DIR, 'timeRecords')

const TASKS_FILE = join(DATA_DIR, 'tasks.json')
const SETTINGS_FILE = join(DATA_DIR, 'settings.json')
const TIME_RECORDS_FILE = join(DATA_DIR, 'timeRecords.json')

const MAX_BACKUPS = 10

const DEFAULT_TASKS = { version: 1, lastUpdated: null, tasks: [] }
const DEFAULT_SETTINGS = { version: 1, lastUpdated: null, theme: 'light', language: 'zh-CN' }
const DEFAULT_TIME_RECORDS = { version: 1, lastUpdated: null, records: [] }

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

function validateTasksData(data) {
  if (!data || typeof data !== 'object') return false
  if (typeof data.version !== 'number') return false
  if (!Array.isArray(data.tasks)) return false
  for (const task of data.tasks) {
    if (!task.id || typeof task.id !== 'string') return false
    if (!task.title || typeof task.title !== 'string') return false
    if (!['high', 'medium', 'low'].includes(task.priority)) return false
    if (!['pending', 'in_progress', 'completed', 'archived'].includes(task.status)) return false
    if (task.dueDate && isNaN(Date.parse(task.dueDate))) return false
  }
  return true
}

function validateSettingsData(data) {
  if (!data || typeof data !== 'object') return false
  if (typeof data.version !== 'number') return false
  if (data.theme && !['light', 'dark'].includes(data.theme)) return false
  if (data.language && typeof data.language !== 'string') return false
  return true
}

function validateTimeRecordsData(data) {
  if (!data || typeof data !== 'object') return false
  if (typeof data.version !== 'number') return false
  if (!Array.isArray(data.records)) return false
  for (const rec of data.records) {
    if (!rec.id || typeof rec.id !== 'string') return false
    if (!rec.taskTitle || typeof rec.taskTitle !== 'string' || !rec.taskTitle.trim()) return false
    if (!rec.startTime || isNaN(Date.parse(rec.startTime))) return false
    if (!rec.endTime || isNaN(Date.parse(rec.endTime))) return false
    if (typeof rec.durationSeconds !== 'number' || rec.durationSeconds < 0) return false
  }
  return true
}

function safeReadJson(filePath, defaultData) {
  try {
    if (!existsSync(filePath)) {
      return JSON.parse(JSON.stringify(defaultData))
    }
    const raw = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)
    return data
  } catch (err) {
    console.error(`[Storage] 读取文件失败: ${filePath}`, err.message)
    return JSON.parse(JSON.stringify(defaultData))
  }
}

function safeWriteJson(filePath, data) {
  try {
    ensureDir(dirname(filePath))
    const tmpPath = filePath + '.tmp'
    writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
    const fs = require('fs')
    fs.renameSync(tmpPath, filePath)
    return { success: true }
  } catch (err) {
    console.error(`[Storage] 写入文件失败: ${filePath}`, err.message)
    return { success: false, error: err.message }
  }
}

function createBackup(filePath, backupDir) {
  try {
    if (!existsSync(filePath)) return { success: true, skipped: true }
    ensureDir(backupDir)
    const now = new Date()
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      '_',
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join('')
    const baseName = filePath.split(/[/\\]/).pop().replace('.json', '')
    const backupPath = join(backupDir, `${baseName}_${timestamp}.json`)
    copyFileSync(filePath, backupPath)
    const backups = readdirSync(backupDir)
      .filter(f => f.startsWith(baseName) && f.endsWith('.json'))
      .sort()
    while (backups.length > MAX_BACKUPS) {
      const oldest = backups.shift()
      unlinkSync(join(backupDir, oldest))
    }
    return { success: true, backupPath }
  } catch (err) {
    console.error('[Storage] 备份失败:', err.message)
    return { success: false, error: err.message }
  }
}

function initializeStorage() {
  ensureDir(DATA_DIR)
  ensureDir(TASKS_BACKUP_DIR)
  ensureDir(TIME_RECORDS_BACKUP_DIR)

  if (!existsSync(TASKS_FILE)) {
    safeWriteJson(TASKS_FILE, DEFAULT_TASKS)
  }
  if (!existsSync(SETTINGS_FILE)) {
    safeWriteJson(SETTINGS_FILE, DEFAULT_SETTINGS)
  }
  if (!existsSync(TIME_RECORDS_FILE)) {
    safeWriteJson(TIME_RECORDS_FILE, DEFAULT_TIME_RECORDS)
  }

  console.log(`[Storage] 数据目录: ${APP_DATA_DIR}`)
}

export function registerStorageIPC() {
  initializeStorage()

  ipcMain.handle('storage:readTasks', () => {
    const data = safeReadJson(TASKS_FILE, DEFAULT_TASKS)
    if (!validateTasksData(data)) {
      console.warn('[Storage] 任务数据验证失败，返回默认数据')
      return JSON.parse(JSON.stringify(DEFAULT_TASKS))
    }
    return data
  })

  ipcMain.handle('storage:writeTasks', (_event, data) => {
    if (!validateTasksData(data)) {
      return { success: false, error: '任务数据验证失败，格式不合法' }
    }
    data.lastUpdated = new Date().toISOString()
    createBackup(TASKS_FILE, TASKS_BACKUP_DIR)
    return safeWriteJson(TASKS_FILE, data)
  })

  ipcMain.handle('storage:readSettings', () => {
    const data = safeReadJson(SETTINGS_FILE, DEFAULT_SETTINGS)
    if (!validateSettingsData(data)) {
      console.warn('[Storage] 设置数据验证失败，返回默认数据')
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
    }
    return data
  })

  ipcMain.handle('storage:writeSettings', (_event, data) => {
    if (!validateSettingsData(data)) {
      return { success: false, error: '设置数据验证失败，格式不合法' }
    }
    data.lastUpdated = new Date().toISOString()
    return safeWriteJson(SETTINGS_FILE, data)
  })

  ipcMain.handle('storage:readTimeRecords', () => {
    const data = safeReadJson(TIME_RECORDS_FILE, DEFAULT_TIME_RECORDS)
    if (!validateTimeRecordsData(data)) {
      console.warn('[Storage] 时间记录数据验证失败，返回默认数据')
      return JSON.parse(JSON.stringify(DEFAULT_TIME_RECORDS))
    }
    return data
  })

  ipcMain.handle('storage:writeTimeRecords', (_event, data) => {
    if (!validateTimeRecordsData(data)) {
      return { success: false, error: '时间记录数据验证失败，格式不合法' }
    }
    data.lastUpdated = new Date().toISOString()
    createBackup(TIME_RECORDS_FILE, TIME_RECORDS_BACKUP_DIR)
    return safeWriteJson(TIME_RECORDS_FILE, data)
  })

  ipcMain.handle('storage:getDataPath', () => {
    return APP_DATA_DIR
  })
}
