<template>
  <the-main-view />
  <dialog-projects />
  <dialog-settings />
  <dialog-help />
  <dialog-password />
</template>

<script setup>
import { computed, inject, watch, onMounted, h } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import TheMainView from './components/TheMainView.vue'
import DialogProjects from './components/DialogProjects.vue'
import DialogSettings from './components/DialogSettings.vue'
import DialogHelp from './components/DialogHelp.vue'
import DialogPassword from './components/DialogPassword.vue'
import { findStyleSheet, getCssRuleText } from './utils'
const { state, commit, dispatch } = useStore()
const {
  isMac, setSpellChecker, toggleFullScreen, showWindow, closeWindow, zoomWindow,
  quitApp, handleRequestCloseWindow, getThemeStyles
} = window.electronAPI
const $Mousetrap = inject('$Mousetrap')

const generalSettings = computed(() => state.settings.general)
const editorSettings = computed(() => state.settings.editor)

watch(() => state.bus.notification, ({ text, type }) => {
  ElMessage({
    message: Array.isArray(text) ? h('p', null, [
      h('span', null, text[0]),
      h('br', null),
      h('b', null, text[1]),
    ]) : text,
    type: type || 'info',
    duration: 5000
  })
})

watch(() => generalSettings.value.theme, (themeName) => {
  loadTheme(themeName)
}, { immediate: true })

watch(() => generalSettings.value.uiScale, (uiScale) => {
  zoomWindow(uiScale / 100)
}, { immediate: true })

watch(() => editorSettings.value.enableSpellChecker, (enable) => {
  setSpellChecker(enable)
}, { immediate: true })

onMounted(() => {
  // Allow drag & drop files to editor area
  document.addEventListener('drop', (event) => {
    event.preventDefault()
    for (const file of event.dataTransfer.files) {
      const filePath = file.path
      if (filePath.endsWith('.html')) dispatch('addActiveFile', { filePath, setCurrent: true })
    }
  }, false)

  setTimeout(() => {
    showWindow(getComputedStyle(document.documentElement).getPropertyValue('--window-bg-color'))
    document.getElementById("app").style.opacity = '1'
  }, 350)
})

// IPC handlers
handleRequestCloseWindow(() => confirmCloseApp())

dispatch('loadAppConfig')
$Mousetrap.bindGlobal(['f1'], () => commit('VIEW_TOGGLE_DIALOG_HELP'))
$Mousetrap.bindGlobal(['f9'], () => commit('VIEW_TOGGLE_DIALOG_SETTINGS'))
$Mousetrap.bindGlobal([isMac() ? 'ctrl+command+f' : 'f11'], toggleFullScreen)
$Mousetrap.bindGlobal(['f12'], () => {
  const toolbars = ['actionBar', 'projectToolbar', 'editorToolbar']
  toolbars.forEach(toolbar => commit('VIEW_TOGGLE_TOOLBAR', { toolbar }))
})
$Mousetrap.bindGlobal(['mod+-'], () => {
  const uiScale = Math.max(generalSettings.value.uiScale - 5, 50)
  dispatch('updateSettings', { settings: { general: { uiScale } } })
})
$Mousetrap.bindGlobal(['mod+='], () => {
  const uiScale = Math.min(generalSettings.value.uiScale + 5, 150)
  dispatch('updateSettings', { settings: { general: { uiScale } } })
})
$Mousetrap.bindGlobal(['mod+0'], () => {
  dispatch('updateSettings', { settings: { general: { uiScale: 100 } } })
})
$Mousetrap.bindGlobal(['command+q'], (event) => {
  event.preventDefault()
  confirmCloseApp(true)
})

async function loadTheme(themeName) {
  // Load theme styles
  const styles = await getThemeStyles(themeName)
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(styles)
  document.adoptedStyleSheets = [sheet]

  // Save editor (.content) styles in sessionStorage to use in saved files
  const selector = '.content'
  const baseEditorStyles = getCssRuleText(findStyleSheet(selector), selector) || ''
  const themeEditorStyles = getCssRuleText(document.adoptedStyleSheets[0], selector) || ''
  sessionStorage.setItem('mainEditorStyle', `${baseEditorStyles} ${themeEditorStyles}`)
}

function confirmCloseApp(forceQuit) {
  // Check if open files have changes
  const i = state.activeFiles.findIndex(file => file.isEdited)
  if (i === -1) { // no changes
    closeApp(forceQuit)
    return
  }

  ElMessageBox.confirm('You probably have some unsaved data. <br>Are you sure you want to quit?', 'Confirmation', {
    confirmButtonText: 'Quit',
    cancelButtonText: 'Cancel',
    dangerouslyUseHTMLString: true,
    type: 'warning'
  }).then(() => {
    closeApp(forceQuit)
  }).catch(() => {})
}

async function closeApp(forceQuit) {
  await dispatch('saveAppConfig')
  if (forceQuit) quitApp()
  else closeWindow()
}
</script>

<style>
html {
  box-sizing: border-box;
}
*, *:before, *:after {
  box-sizing: inherit;
}

body {
  user-select: none;
  margin: 0;
  overflow: hidden;
}

body, input, textarea, select, button {
  font-family: var(--ui-font-family);
}

body::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

div::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

body::-webkit-scrollbar-thumb, div::-webkit-scrollbar-thumb {
  background: var(--scrollbar-color);
  border-radius: 5px;
}

body::-webkit-scrollbar-track, div::-webkit-scrollbar-track {
  background: var(--scrollbar-bg-color);
}

body::-webkit-scrollbar-corner, div::-webkit-scrollbar-corner {
  background: var(--scrollbar-bg-color);
}

::placeholder {
  color: var(--element-placeholder-color) !important;
}

#app {
  height: 100vh;
}
</style>
