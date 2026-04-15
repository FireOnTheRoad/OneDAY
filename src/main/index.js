import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerStorageIPC } from './storage'

function getIconPath() {
  if (process.platform === 'win32') {
    return join(__dirname, '../../resources/icon.ico')
  }
  return join(__dirname, '../../resources/icon.png')
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    resizable: true,
    minWidth: 900,
    minHeight: 600,
    icon: getIconPath(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerWindowIPC() {
  ipcMain.handle('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.handle('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle('window:isMaximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })

  ipcMain.handle('window:getBounds', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.getBounds() ?? null
  })

  ipcMain.handle('window:setBounds', (event, bounds) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.setBounds(bounds)
  })

  let dragState = null

  ipcMain.on('window:dragStart', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    if (win.isMaximized()) return
    const pos = win.getPosition()
    dragState = { winX: pos[0], winY: pos[1] }
  })

  ipcMain.on('window:dragMove', (event, deltaX, deltaY) => {
    if (!dragState) return
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    dragState.winX += deltaX
    dragState.winY += deltaY
    win.setPosition(dragState.winX, dragState.winY)
  })

  ipcMain.on('window:dragEnd', () => {
    dragState = null
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.oneday')

  registerStorageIPC()
  registerWindowIPC()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
