import { createStore } from 'vuex'
import { unProxy } from '../utils'

import * as types from './mutation-types'
import * as htmlTemplates from '../templates/html-templates'
import * as cssTemplates from '../templates/css-templates'
import defaultSettings from '../assets/json/defaultSettings.json'
import { processHtml, generateHtml, getFileErrorInfo } from '../utils'

const {
  isFullScreen, getConfig, setConfig, getFilePathFromUrl, getFileNameFromPath, readFile, writeFile, renameFile
} = window.electronAPI
const fallbackEditorFonts = 'system-ui,sans-serif'
const maxRecentFiles = 5
let newFileId = 1
let lastPassword = ''

const state = {
  bus: {
    project: null, // possible actions: create, rename, delete, save-all
    file: null, // possible actions: open, save, save-as, save-all, rename, show-in-folder
    editor: null, // possible actions: focus
    modal: null, // possible actions: password
    notification: null
  },
  configLoading: false,

  newFileName: 'File-1',
  currentFile: {},
  activeFiles: [],
  recentFiles: [],
  currentProject: {},
  projects: [],
  view: {
    sidebar: {
      visible: true,
      width: 0
    },
    actionBar: {
      visible: true
    },
    projectToolbar: {
      visible: true
    },
    editorToolbar: {
      visible: true
    },
    dialogProjects: {
      visible: false
    },
    dialogSettings: {
      visible: false
    },
    dialogHelp: {
      visible: false
    },
    dialogPassword: {
      visible: false,
    },
  },
  settings: {
    general: Object.assign({}, defaultSettings.general),
    files: Object.assign({}, defaultSettings.files),
    editor: Object.assign({}, defaultSettings.editor),
  }
}

const getters = {
  allowShortcuts: state => {
    const view = state.view
    return !(view.dialogProjects.visible || view.dialogSettings.visible || view.dialogHelp.visible)
  },
  editorStyle: state => {
    const s = state.settings.editor
    let style = ''
    style += `font-family:${s.font + ',' + fallbackEditorFonts};`
    style += `font-size:${s.fontSize}px;`
    if (!s.useThemeFontColor) style += `color:${s.fontColor};`
    if (!s.useThemeBackgroundColor) style += `background-color:${s.backgroundColor};`
    style += `line-height:${s.lineHeight};`
    return style
  },
  fileStyle: state => {
    const s = state.settings.files
    return s.contentWidth > 0 ? `main{max-width:${s.contentWidth}px;margin:0 auto}p:empty{height:1lh}` : ''
  },
  allToolbarsVisible: state => {
    return state.view.actionBar.visible && state.view.projectToolbar.visible && state.view.editorToolbar.visible
  },
  getProjectByName: state => name => {
    return state.projects.find(project => project.name === name)
  },
  getActiveFileById: state => id => {
    return state.activeFiles.find(file => file.id === id)
  },
  getActiveFileByPath: state => path => {
    return state.activeFiles.find(file => file.path === path)
  }
}

const mutations = {
  [types.BUS_ADD_MESSAGE](state, { section, message }) {
    state.bus[section] = message
  },

  [types.PROJECT_ADD](state, project) {
    state.projects.push(project)
  },

  [types.PROJECT_DELETE](state, projectName) {
    const i = state.projects.findIndex(project => project.name === projectName)
    if (i !== -1) state.projects.splice(i, 1)
  },

  [types.PROJECT_SET_CURRENT](state, projectName) {
    if (!projectName) {
      state.currentProject = {}
      return
    }
    const i = state.projects.findIndex(project => project.name === projectName)
    if (i !== -1) state.currentProject = state.projects[i]
  },

  [types.PROJECT_SET_NAME](state, { projectName, newName }) {
    const i = state.projects.findIndex(project => project.name === projectName)
    if (i !== -1) state.projects[i].name = newName
  },

  [types.PROJECT_SET_DATA](state, { projectName, data }) {
    const i = state.projects.findIndex(project => project.name === projectName)
    if (i !== -1) state.projects[i].data = data
  },

  [types.PROJECT_REPLACE_FILE](state, { filePath, newFilePath, newFileName }) {
    traverseProjectData(state.projects)

    function traverseProjectData(obj) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] !== 'object' || obj[key] === null) return

        if (obj[key]['type'] === 'file') {
          if (!obj[key]['data']) return
          if (obj[key]['data']['path'] === filePath) {
            obj[key]['text'] = newFileName
            obj[key]['data']['path'] = newFilePath
          }
        } else {
          traverseProjectData(obj[key])
        }
      })
    }
  },

  [types.FILE_SET_NEW_NAME](state) {
    const name = state.newFileName.slice(0, 5)
    const num = +state.newFileName.slice(5) + 1
    state.newFileName = name + num
  },

  [types.FILE_SET_CURRENT](state, fileId) {
    const i = state.activeFiles.findIndex(file => file.id === fileId)
    if (i !== -1) state.currentFile = state.activeFiles[i]
  },

  [types.FILE_ADD_ACTIVE](state, file) {
    state.activeFiles.push(file)
  },

  [types.FILE_DELETE_ACTIVE](state, fileId) {
    const i = state.activeFiles.findIndex(file => file.id === fileId)
    if (i !== -1) state.activeFiles.splice(i, 1)
  },

  async [types.FILE_ADD_RECENT](state, { fileName, filePath }) {
    const i = state.recentFiles.findIndex(file => file.path === filePath)
    if (i === 0) return

    if (i > 0) state.recentFiles.splice(i, 1)
    state.recentFiles.unshift({ name: fileName, path: filePath })

    if (state.recentFiles.length > maxRecentFiles) state.recentFiles.pop()
  },

  [types.FILE_DELETE_RECENT](state, filePath) {
    const i = state.recentFiles.findIndex(file => file.path === filePath)
    if (i !== -1) state.recentFiles.splice(i, 1)
  },

  [types.FILE_SET_SEARCH_MODE](state, { fileId, value }) {
    const i = state.activeFiles.findIndex(file => file.id === fileId)

    if (value === undefined) { // toggle
      state.activeFiles[i].isSearchMode = !state.activeFiles[i].isSearchMode
    } else {
      state.activeFiles[i].isSearchMode = value
    }
  },

  [types.FILE_SET_PROPS](state, { fileId, props }) {
    const i = state.activeFiles.findIndex(file => file.id === fileId)
    if (i === -1) return
    Object.keys(props).forEach(prop => {
      if (prop === 'savedCounter') state.activeFiles[i][prop] += 1
      else state.activeFiles[i][prop] = props[prop]
    })
  },

  [types.SETTINGS_SET](state, settings) {
    Object.keys(settings).forEach(section => {
      // avoid error when open config with unknown settings section (e.g. config created in newer versions)
      if (!state.settings[section]) state.settings[section] = {}
      Object.keys(settings[section]).forEach(key => {
        state.settings[section][key] = settings[section][key]
      })
    })
  },

  [types.VIEW_TOGGLE_SIDEBAR](state, flag) {
    if (flag !== undefined) state.view.sidebar.visible = flag
    else state.view.sidebar.visible = !state.view.sidebar.visible
  },

  [types.VIEW_TOGGLE_TOOLBAR](state, { toolbar, flag }) {
    if (flag !== undefined) state.view[toolbar].visible = flag
    else state.view[toolbar].visible = !state.view[toolbar].visible
  },

  [types.VIEW_TOGGLE_DIALOG_PROJECTS](state, flag) {
    if (flag !== undefined) state.view.dialogProjects.visible = flag
    else state.view.dialogProjects.visible = !state.view.dialogProjects.visible
  },

  [types.VIEW_TOGGLE_DIALOG_SETTINGS](state, flag) {
    if (flag !== undefined) state.view.dialogSettings.visible = flag
    else state.view.dialogSettings.visible = !state.view.dialogSettings.visible
  },

  [types.VIEW_TOGGLE_DIALOG_HELP](state, flag) {
    if (flag !== undefined) state.view.dialogHelp.visible = flag
    else state.view.dialogHelp.visible = !state.view.dialogHelp.visible
  },

  [types.VIEW_SET_SIDEBAR_WIDTH](state, width) {
    state.view.sidebar.width = width
  }
}

const actions = {
  async loadAppConfig({ dispatch, commit, state, getters }) {
    let appConfig = await getConfig()
    if (!appConfig) {
      commit('BUS_ADD_MESSAGE', { section: 'notification', message: { text: 'Configuration file is not accessible', type: 'warning' } })
      appConfig = {}
    }

    // Populate app config with initial settings (only for those that are not set)
    for (const section of Object.keys(state.settings)) { // loop settings sections
      for (const key of Object.keys(state.settings[section])) {
        if (appConfig.settings?.[section]?.[key] === undefined)
          await setConfig(`settings.${section}.${key}`, unProxy(state.settings[section][key])) // unProxy is required for objects/arrays
      }
    }

    try {
      // Settings
      if (appConfig.settings) commit(types.SETTINGS_SET, appConfig.settings)

      // View
      if (appConfig.view) {
        if (appConfig.view.sidebar) {
          if (appConfig.view.sidebar.visible !== undefined) commit(types.VIEW_TOGGLE_SIDEBAR, appConfig.view.sidebar.visible)
          if (appConfig.view.sidebar.width) commit(types.VIEW_SET_SIDEBAR_WIDTH, appConfig.view.sidebar.width)
        }
        if (appConfig.view.actionBar && appConfig.view.actionBar.visible !== undefined) {
          commit(types.VIEW_TOGGLE_TOOLBAR, { toolbar: 'actionBar', flag: appConfig.view.actionBar.visible })
        }
        if (appConfig.view.projectToolbar && appConfig.view.projectToolbar.visible !== undefined) {
          commit(types.VIEW_TOGGLE_TOOLBAR, { toolbar: 'projectToolbar', flag: appConfig.view.projectToolbar.visible })
        }
        if (appConfig.view.editorToolbar && appConfig.view.editorToolbar.visible !== undefined) {
          commit(types.VIEW_TOGGLE_TOOLBAR, { toolbar: 'editorToolbar', flag: appConfig.view.editorToolbar.visible })
        }
      }

      // Projects
      if (appConfig.projects && appConfig.projects.length) {
        appConfig.projects.forEach(project => {
          commit(types.PROJECT_ADD, {
            name: project.name,
            data: project.data || null
          })
        })
      }
      if (appConfig.currentProject) {
        commit(types.PROJECT_SET_CURRENT, appConfig.currentProject)
      }

      // Active files (correspond to tabs)
      if (appConfig.activeFiles?.length) {
        for (const filePath of appConfig.activeFiles) {
          await dispatch('addActiveFile', { filePath })
        }
      } else { dispatch('addNewActiveFile') }

      // Recent files
      if (appConfig.recentFiles?.length) {
        for (const filePath of appConfig.recentFiles) {
          const fileName = await getFileNameFromPath(filePath)
          commit(types.FILE_ADD_RECENT, {fileName, filePath})
        }
      }

      // Current file
      if (appConfig.currentFile) {
        const file = getters.getActiveFileByPath(appConfig.currentFile)
        if (file) commit(types.FILE_SET_CURRENT, file.id)
      }
    } catch (e) {
      commit('BUS_ADD_MESSAGE', {
        section: 'notification', message: { text: 'Unable to load/create configuration file', type: 'error' }
      })
      dispatch('addNewActiveFile')
    }
    return true
  },

  async saveAppConfig({ commit, state }) {
    if (!await getConfig()) return

    const activeFilesPaths = state.activeFiles.map(file => file.path).filter(path => path)
    const recentFilesPaths = state.recentFiles.map(file => file.path)
    try {
      if (state.currentFile.path) await setConfig('currentFile', state.currentFile.path || '')
      await setConfig('activeFiles', activeFilesPaths)
      await setConfig('recentFiles', recentFilesPaths)
      await setConfig('currentProject', state.currentProject.name || '')
      await setConfig('projects', unProxy(state.projects))

      const windowSettings = Object.assign({}, await getConfig('view.window'))
      if (await isFullScreen()) { // do not overwrite position/size if fullscreen
        windowSettings.fullscreen = true
      } else {
        windowSettings.width = window.outerWidth
        windowSettings.height = window.outerHeight
        windowSettings.x = window.screenX
        windowSettings.y = window.screenY
        windowSettings.fullscreen = false
      }
      await setConfig('view', {
        sidebar: {
          visible: state.view.sidebar.visible,
          width: state.view.sidebar.width
        },
        actionBar: {
          visible: state.view.actionBar.visible
        },
        projectToolbar: {
          visible: state.view.projectToolbar.visible
        },
        editorToolbar: {
          visible: state.view.editorToolbar.visible
        },
        window: windowSettings
      })
    } catch (e) {
      commit('BUS_ADD_MESSAGE', {
        section: 'notification', message: { text: 'Unable to save app configuration', type: 'error' }
      })
    }
    return true
  },

  async updateSettings({ commit }, { settings }) {
    commit(types.SETTINGS_SET, settings)

    try {
      for (const section of Object.keys(settings)) { // loop settings sections
        for (const key of Object.keys(settings[section])) {
          await setConfig(`settings.${section}.${key}`, settings[section][key])
        }
      }
    } catch (e) {
      commit('BUS_ADD_MESSAGE', { section: 'notification', message: { text: 'Unable to update settings', type: 'error' } })
    }
    return true
  },

  createProject({ commit }, { projectName, setCurrent }) {
    commit(types.PROJECT_ADD, {
      name: projectName,
      data: null
    })
    if (setCurrent) commit(types.PROJECT_SET_CURRENT, projectName)
    return true
  },

  async saveProjects({ commit, state }) {
    if (!state.projects.length) return

    try {
      await setConfig('currentProject', state.currentProject.name || '')
      await setConfig('projects', unProxy(state.projects))
    } catch (e) {
      commit('BUS_ADD_MESSAGE', {
        section: 'notification', message: { text: 'Unable to save projects data', type: 'error' }
      })
    }
  },

  deleteProject({ commit, state }, { projectName }) {
    if (projectName === state.currentProject.name) commit(types.PROJECT_SET_CURRENT, null)
    commit(types.PROJECT_DELETE, projectName)
    return true
  },

  async addActiveFile({ commit, state }, { filePath, setCurrent }) {
    const isNew = !filePath

    if (!isNew) {
      // Check if already in active files
      const file = state.activeFiles.find(file => file.path === filePath)
      if (file) {
        if (setCurrent) commit(types.FILE_SET_CURRENT, file.id)
        return true
      }
    }

    const fileId = String(newFileId++)
    commit(types.FILE_ADD_ACTIVE, {
      id: fileId,
      name: isNew ? state.newFileName : await getFileNameFromPath(filePath),
      path: filePath,
      data: null,
      dataType: isNew ? 'c' : null,
      isReady: isNew,
      isEdited: false,
      isSearchMode: false,
      isEncrypted: filePath.endsWith('.htmr'),
      password: '',
      savedCounter: 0
    })
    if (setCurrent) commit(types.FILE_SET_CURRENT, fileId)
    if (isNew) commit(types.FILE_SET_NEW_NAME)
    else commit(types.FILE_DELETE_RECENT, filePath)
  },

  addNewActiveFile({ dispatch }) {
    dispatch('addActiveFile', { filePath: '', setCurrent: true })
  },

  async openFile({ state, commit, dispatch }, { fileId, filePath }) {
    if (filePath.startsWith('file://')) filePath = await getFilePathFromUrl(filePath)

    const processFile = async (password) => {
      const { data, dataType } = processHtml(await readFile(filePath, password))
      commit('FILE_SET_PROPS', { fileId, props: { isReady: true, data, dataType, password }})
    }

    try {
      let password = ''
      if (filePath.endsWith('htmr')) { // password required to decrypt file
        // Try to decrypt file using latest user password if allowed
        if (state.settings.files.useSinglePassword && lastPassword) {
          try {
            await processFile(lastPassword)
            return true
          } catch (e) {
            if (!e.message.includes('auth')) throw e
          }
        }

        const fileName = await getFileNameFromPath(filePath)
        const passwordPromise = new Promise((resolve) => {
          commit('BUS_ADD_MESSAGE', { section: 'modal', message: {
            text: 'password', action: 'Decrypt', fileName, resolver: resolve
          } })
        })
        password = await passwordPromise
        if (!password) {
          dispatch('closeFile', { fileId })
          return false
        }
      }

      await processFile(password)
      lastPassword = password
    } catch (e) {
      dispatch('closeFile', { fileId })
      let text = `Unable to open file "${filePath}".`
      const info = getFileErrorInfo(e.message)
      text = info ?  [text, info] : text
      commit('BUS_ADD_MESSAGE', { section: 'notification', message: { text, type: 'error' } })
      return false
    }
    return true
  },

  async saveFile({ commit, getters }, { file, filePath, content }) {
    const newFileName = await getFileNameFromPath(filePath)
    const editorStyle = getters.editorStyle
    const fileStyle = getters.fileStyle
    const outputHtml = generateHtml(htmlTemplates.base, {
      title: newFileName,
      styleBase: `${cssTemplates.base}${fileStyle}`,
      styleMain: sessionStorage.getItem('mainEditorStyle'),
      styleExtra: `.content{${editorStyle}}`,
      content
    })

    try {
      const willEncrypt = filePath.endsWith('htmr')
      let password = willEncrypt ? file.password : ''
      if (willEncrypt && !password) {
        const passwordPromise = new Promise((resolve) => {
          commit('BUS_ADD_MESSAGE', { section: 'modal', message: {
            text: 'password', action: 'Encrypt', fileName: newFileName, resolver: resolve
          } })
        })
        password = await passwordPromise
        if (!password) return false
        lastPassword = password
      }

      await writeFile(filePath, file.path, outputHtml, password)

      commit(types.FILE_SET_PROPS, {
        fileId: file.id,
        props: {
          name: newFileName,
          path: filePath,
          isEdited: false,
          isEncrypted: willEncrypt,
          password,
          savedCounter: 1
        }
      })
    } catch (e) {
      let text = `Unable to save file "${filePath}".`
      const info = getFileErrorInfo(e.message)
      text = info ?  [text, info] : text
      commit('BUS_ADD_MESSAGE', { section: 'notification', message: { text, type: 'error' } })
      return false
    }
    return true
  },

  async renameFile({ commit }, { file, newFileName }) {
    const filePath = file.path
    try {
      const newFilePath = await renameFile(filePath, newFileName)
      commit(types.FILE_SET_PROPS, { fileId: file.id, props: { name: newFileName, path: newFilePath } })
      commit(types.PROJECT_REPLACE_FILE, { filePath, newFilePath, newFileName })
      commit(types.BUS_ADD_MESSAGE, { section: 'project', message: { text: 'reload' } })
    } catch (e) {
      let text = `Unable to rename file "${filePath}".`
      const info = getFileErrorInfo(e.message)
      text = info ?  [text, info] : text
      commit('BUS_ADD_MESSAGE', { section: 'notification', message: { text, type: 'error' } })
    }
  },

  closeFile({ dispatch, commit, state, getters }, { fileId }) {
    const len = state.activeFiles.length
    const file = getters.getActiveFileById(fileId)
    if (len === 1) dispatch('addNewActiveFile')

    // Activate other file
    if (state.currentFile.id === fileId) {
      for (let i = 0; i < len; i += 1) {
        if (state.activeFiles[i].id !== fileId) continue
        if (i < len - 1) commit(types.FILE_SET_CURRENT, state.activeFiles[i + 1].id)
        else commit(types.FILE_SET_CURRENT, state.activeFiles[i - 1].id)
        break
      }
    }

    if (file.path) commit(types.FILE_ADD_RECENT, { fileName: file.name, filePath: file.path })
    commit(types.FILE_DELETE_ACTIVE, fileId)
    return true
  }
}

export default createStore({
  state,
  getters,
  mutations,
  actions,
  strict: import.meta.env.MODE === 'development',
})
