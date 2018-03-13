'use strict'

import { app, BrowserWindow, ipcMain as ipc, dialog } from 'electron'
import path from 'path'
import Store from 'electron-store'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
} else {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true
}

// Open app config and keep it in globals
global.config = null
try {
  global.config = new Store()
} catch (e) {}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  let mainWindowOptions = {
    show: false,
    backgroundColor: '#effafe',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600
    // webPreferences: {
    //   devTools: false
    // }
  }

  const appConfig = global.config
  if (appConfig) {
    try {
      Object.assign(mainWindowOptions, appConfig.get('view.window'))
      if (mainWindowOptions.fullscreen === false) delete mainWindowOptions.fullscreen
    } catch (e) {}
  } else {
    mainWindowOptions.center = true
  }

  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow(mainWindowOptions)

  mainWindow.loadURL(winURL)

  mainWindow.setMenu(null)

  mainWindow.allowClose = false
  mainWindow.on('close', (event) => {
    if (!mainWindow.allowClose) {
      event.preventDefault()
      event.sender.send('request-close-window')
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */

// ********** Handlers **********

ipc.on('close-window', function (event) {
  mainWindow.allowClose = true
  mainWindow.close() // will quit the app in Windows
})

ipc.on('quit-app', function (event) {
  mainWindow.allowClose = true
  app.quit()
})

ipc.on('open-file-dialog', function (event, payload) {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'HTML files', extensions: ['html', 'htm'] }
    ]
  }, function (files) {
    if (files) {
      if (payload && payload.target === 'pt') event.sender.send('add-project-files', files, payload.action)
      else event.sender.send('open-file', files)
    }
  })
})

ipc.on('save-file-dialog', function (event, payload) {
  let defaultPath = app.getPath('home')
  if (payload) {
    if (payload.fileName) defaultPath = path.join(defaultPath, payload.fileName)
    else if (payload.filePath) defaultPath = payload.filePath
  }

  const options = {
    title: 'Save file',
    filters: [
      { name: 'HTML files', extensions: ['html', 'htm'] }
    ],
    defaultPath
  }
  dialog.showSaveDialog(options, function (filename) {
    event.sender.send('save-file', filename)
  })
})
