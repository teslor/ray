import {
  app, BrowserWindow, BrowserWindowConstructorOptions, ipcMain, session, shell, dialog, Menu, MenuItem
} from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import Store from 'electron-store'
import log from 'loglevel'
import { getThemeList, copyThemes, readThemeStyles } from './utils.js'
import { encryptFile, decryptFile } from './crypto.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appState = {
  configLoaded: false,
  themesDefined: false,
  versionUpdated: false,
  appThemes: [] as string[], // embedded themes
  userThemes: [] as string[], // themes in user directory
  currentFileDir: app.getPath('home'),
  version: ''
}

if (process.env.NODE_ENV !== 'development') {
  log.setLevel('error')
  appState.version = app.getVersion()
} else {
  log.setLevel('trace')
  appState.version = process.env.npm_package_version || ''
}

let config // app config with user settings
try {
  config = new Store()
  appState.configLoaded = true
  log.info('Config loaded')
} catch (e) {}

let mainWindow
function createWindow() {
  const mainWindowOptions: BrowserWindowConstructorOptions = {
    show: false,
    width: 1200,
    height: 1000,
    minWidth: 800,
    minHeight: 600,
  }
  mainWindowOptions.webPreferences = {
    preload: path.join(__dirname, 'preload.cjs'),
    nodeIntegration: false,
    contextIsolation: true,
  }

  if (config) { // Get app version, window options and UI scale from the config
    try {
      // Update app version
      const configVersion = config.get('version')
      if (appState.version !== configVersion) {
        config.set('version', appState.version)
        appState.versionUpdated = true
      }
      // Set window size/position
      Object.assign(mainWindowOptions, config.get('view.window'))
      if (!mainWindowOptions.fullscreen) delete mainWindowOptions.fullscreen
      // Set window zoom factor
      mainWindowOptions.webPreferences.zoomFactor = (config.get('settings.general.uiScale') || 100) / 100
      log.info('Initial settings loaded')
    } catch (e) {}
  } else {
    mainWindowOptions.center = true
  }

  mainWindow = new BrowserWindow(mainWindowOptions)

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2]
    mainWindow.loadURL(`http://localhost:${rendererPort}`)
  }
  else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'renderer', 'index.html'))
  }

  mainWindow.setMenu(null)

  mainWindow.allowClose = false
  mainWindow.on('close', (event) => {
    if (!mainWindow.allowClose) {
      event.preventDefault()
      mainWindow.webContents.send('request-close-window')
    }
  })

  // Spell check handler
  mainWindow.webContents.on('context-menu', (event, params) => {
    if (!params.misspelledWord) return

    const menu = new Menu()

    // Add each spelling suggestion
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(new MenuItem({
        label: suggestion,
        click: () => mainWindow.webContents.replaceMisspelling(suggestion)
      }))
    }

    // Allow users to add the misspelled word to the dictionary
    menu.append(
      new MenuItem({
        label: 'Add to dictionary',
        click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
      })
    )

    menu.popup()
  })
}

/* App handlers */

app.whenReady().then(() => {
  createWindow()
  log.info('Window created')

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['script-src \'self\'; worker-src blob:'] // worker-src is required for jstree
      }
    })
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

/* IPC handlers: general */

ipcMain.on('update-app-state', function (event, payload) {
  if (payload.key === 'currentFileDir') appState.currentFileDir = path.dirname(payload.value)
})

ipcMain.on('set-spell-checker', function (event, enable) {
  mainWindow.webContents.session.setSpellCheckerEnabled(enable)
})

/* IPC handlers: window */

ipcMain.on('show-window', function (event, color) {
  mainWindow.setBackgroundColor(color)
  mainWindow.show()
})

ipcMain.on('close-window', function () {
  mainWindow.allowClose = true
  mainWindow.close() // will quit the app in Windows
})

ipcMain.on('set-window-title', function (event, title) {
  mainWindow.setTitle(title)
})

ipcMain.on('zoom-window', function (event, factor) {
  mainWindow.webContents.setZoomFactor(factor)
})

ipcMain.on('quit-app', function () {
  mainWindow.allowClose = true
  app.quit()
})

ipcMain.handle('is-full-screen', () => mainWindow.isFullScreen())

ipcMain.on('toggle-full-screen', () => {
  mainWindow.setFullScreen(!mainWindow.isFullScreen())
})

/* IPC handlers: config */

ipcMain.handle('get-config', (event, key) => key ? config?.get(key) : config?.store)

ipcMain.handle('set-config', (event, key, value) => config?.set(key, value))

/* IPC handlers: shell */

ipcMain.on('open-folder', (event, fullPath) => {
  if (!fullPath && !config) return
  shell.showItemInFolder(fullPath || config.path)
})

ipcMain.on('open-url', (event, url) => shell.openExternal(url))

/* IPC handlers: files */

ipcMain.handle('get-file-path-from-url', (event, fileUrl) =>
  fileURLToPath(fileUrl)
)

ipcMain.handle('get-file-name-from-path', (event, filePath) =>
  path.basename(filePath, path.extname(filePath))
)

ipcMain.handle('read-file', (event, filePath, password) => {
  if (password) return decryptFile(filePath, password)
  else return fs.readFile(filePath, 'utf8')
})

ipcMain.handle('write-file', async (event, filePath, oldFilePath, data, password) => {
  if (password) await encryptFile(filePath, data, password)
  else await fs.writeFile(filePath, data)
  if (oldFilePath && filePath?.slice(-4) !== oldFilePath.slice(-4))
    await fs.unlink(oldFilePath) // delete old file if format is updated
})

ipcMain.handle('rename-file', async (event, filePath, fileName) => {
  const newFilePath = path.join(path.dirname(filePath), fileName + path.extname(filePath))
  if (existsSync(newFilePath)) throw new Error('EEXIST')
  await fs.rename(filePath, newFilePath)
  return newFilePath
})

ipcMain.handle('get-theme-styles', async (event, themeName = 'Ray') => {
  const appThemesDir = path.join(app.getAppPath(), 'static/Themes')
  const userThemesDir = path.join(app.getPath('userData'), 'Themes')
  if (!appState.themesDefined) {
    try {
      appState.appThemes = await getThemeList(appThemesDir)
      await copyThemes(appThemesDir, userThemesDir, appState.appThemes, appState.versionUpdated)
      appState.userThemes = await getThemeList(userThemesDir)
      log.info('Themes processed')
    } catch {}
    finally {
      appState.themesDefined = true
    }
  }
  let styles = ''
  if (appState.userThemes.find(t => t === themeName)) { // try to load the theme styles from user dir first
    styles = await readThemeStyles(path.join(userThemesDir, `${themeName}.css`))
  }
  if (!styles && appState.userThemes[themeName]) {
    styles = await readThemeStyles(path.join(appThemesDir, `${themeName}.css`))
  }
  return styles
})

ipcMain.handle('get-themes', () => {
  return [...new Set([...appState.userThemes, ...appState.userThemes])].sort()
})

/* IPC handlers: dialogs */

ipcMain.on('open-file-dialog', (event, payload) => {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'HTML files', extensions: ['html', 'htm', 'htmr'] }
    ],
    defaultPath: appState.currentFileDir
  }).then(({ filePaths}) => {
    if (filePaths.length) {
      if (payload?.target === 'pc') event.sender.send('add-project-files', filePaths, payload.action)
      else event.sender.send('open-files', filePaths)
    }
  })
})

ipcMain.on('open-image-dialog', (event) => {
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }
    ],
    defaultPath: appState.currentFileDir
  }).then(async ({ filePaths }) => {
    if (!filePaths.length) return
    const encodedImage = `data:image/${path.extname(filePaths[0]).slice(1)};base64,` +  await fs.readFile(filePaths[0], 'base64')
    event.sender.send('open-image', encodedImage)
  })
})

ipcMain.on('save-file-dialog', (event, payload = {}) => {
  const { fileName, filePath } = payload
  let defaultPath = appState.currentFileDir

  if (fileName) defaultPath = path.join(appState.currentFileDir, fileName) // save
  else if (filePath) defaultPath = filePath // save as
  const ext = (fileName || filePath).slice(-4)

  const options = {
    filters: [
      { name: ext === 'htmr' ? 'HTML files (encrypted)' : 'HTML files', extensions: [ext] }
    ],
    defaultPath
  }
  dialog.showSaveDialog(options).then(({ filePath }) => {
    if (filePath) event.sender.send('save-file', { filePath })
  })
})
