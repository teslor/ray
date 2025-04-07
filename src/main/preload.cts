import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // General
  isMac: () => process.platform === 'darwin',
  updateAppState: payload => ipcRenderer.send('update-app-state', payload),
  setSpellChecker: enable => ipcRenderer.send('set-spell-checker', enable),

  // Window
  showWindow: color => ipcRenderer.send('show-window', color),
  closeWindow: () => ipcRenderer.send('close-window'),
  setWindowTitle: title => ipcRenderer.send('set-window-title', title),
  zoomWindow: factor => ipcRenderer.send('zoom-window', factor),
  quitApp: () => ipcRenderer.send('quit-app'),
  isFullScreen: () => ipcRenderer.invoke('is-full-screen'),
  toggleFullScreen: () => ipcRenderer.send('toggle-full-screen'),
  handleRequestCloseWindow: callback => ipcRenderer.on('request-close-window', callback), // renderer

  // Config
  getConfig: key => ipcRenderer.invoke('get-config', key),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),

  // Shell
  openFolder: fullPath => ipcRenderer.send('open-folder', fullPath),
  openUrl: url => ipcRenderer.send('open-url', url),

  // Files
  getFilePathFromUrl: fileUrl => ipcRenderer.invoke('get-file-path-from-url', fileUrl),
  getFileNameFromPath: filePath => ipcRenderer.invoke('get-file-name-from-path', filePath),
  readFile: (filePath, password) => ipcRenderer.invoke('read-file', filePath, password),
  writeFile: (filePath, oldFilePath, data, password) => ipcRenderer.invoke('write-file', filePath, oldFilePath, data, password),
  renameFile: (filePath, fileName) => ipcRenderer.invoke('rename-file', filePath, fileName),
  getThemeStyles: (themeName) => ipcRenderer.invoke('get-theme-styles', themeName),
  getThemes: () => ipcRenderer.invoke('get-themes'),
  handleAddProjectFiles: callback => ipcRenderer.on('add-project-files', callback), // renderer

  // Dialogs
  openFileDialog: payload => ipcRenderer.send('open-file-dialog', payload),
  openImageDialog: () => ipcRenderer.send('open-image-dialog'),
  saveFileDialog: payload => ipcRenderer.send('save-file-dialog', payload),
  handleOpenFiles: callback => ipcRenderer.on('open-files', callback), // renderer
  handleOpenImage: callback => ipcRenderer.on('open-image', callback), // renderer
  handleSaveFile: callback => ipcRenderer.on('save-file', callback), // renderer
})
