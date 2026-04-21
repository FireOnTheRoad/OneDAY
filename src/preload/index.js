import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  readTasks: () => ipcRenderer.invoke('storage:readTasks'),
  writeTasks: (data) => ipcRenderer.invoke('storage:writeTasks', data),
  readSettings: () => ipcRenderer.invoke('storage:readSettings'),
  writeSettings: (data) => ipcRenderer.invoke('storage:writeSettings', data),
  readTimeRecords: () => ipcRenderer.invoke('storage:readTimeRecords'),
  writeTimeRecords: (data) => ipcRenderer.invoke('storage:writeTimeRecords', data),
  readProjects: () => ipcRenderer.invoke('storage:readProjects'),
  writeProjects: (data) => ipcRenderer.invoke('storage:writeProjects', data),
  getDataPath: () => ipcRenderer.invoke('storage:getDataPath'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  getWindowBounds: () => ipcRenderer.invoke('window:getBounds'),
  setWindowBounds: (bounds) => ipcRenderer.invoke('window:setBounds', bounds),
  windowDragStart: () => ipcRenderer.send('window:dragStart'),
  windowDragMove: (deltaX, deltaY) => ipcRenderer.send('window:dragMove', deltaX, deltaY),
  windowDragEnd: () => ipcRenderer.send('window:dragEnd')
})
