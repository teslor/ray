<template>
  <div class="file-container">
    <el-tabs
      v-model="activeTabName"
      class="file-tabs"
      type="border-card"
      editable
      @edit="onTabsEdit"
    >
      <el-tab-pane v-for="file in activeFiles" :key="file.id" :name="file.id" closable>
        <template #label>
          <span>
            {{ file.name }}
            <transition name="el-zoom-in-center">
              <span v-if="file.isEdited" class="file-changed-mark" />
            </transition>
            <span v-if="file.isEncrypted" class="file-encrypted-mark">#</span>
          </span>
        </template>
        <transition name="fade">
          <template v-if="file.isReady">
            <file-editor v-if="file.dataType" ref="editors" :file="file" />
            <file-viewer v-else :file="file" />
          </template>
          <div v-else class="content placeholder" />
        </transition>
      </el-tab-pane>
    </el-tabs>
    <div
      v-if="dragState.isDragging"
      class="tab-drop-marker"
      :style="{ transform: `translateX(${dragState.markerPosition}px)` }"
    />
  </div>
</template>

<script setup>
import { inject, useTemplateRef, ref, computed, watch, onMounted } from 'vue'
import { useEventListener } from '@vueuse/core'
import { useStore } from 'vuex'
import { ElMessageBox } from 'element-plus'
import FileEditor from './FileEditor.vue'
import FileViewer from './FileViewer.vue'
const { state, getters, commit, dispatch } = useStore()
const {
  setWindowTitle, openFolder, openFileDialog, saveFileDialog,
  handleOpenFiles, handleOpenImage, handleSaveFile,
} = window.electronAPI
const $Mousetrap = inject('$Mousetrap')

const editorsRefs = useTemplateRef('editors') // array of FileEditor components
const activeTabName = ref('') // matches active file.id
const autosaveTimer = ref(null)

const currentFile = computed(() => state.currentFile)
const activeFiles = computed(() => state.activeFiles)
const filesSettings = computed(() => state.settings.files)
const busMessageFile = computed(() => state.bus.file)
const busMessageEditor = computed(() => state.bus.editor)
const allowShortcuts = computed(() => getters.allowShortcuts)

let tabsNav = null

// Drag and drop state for a tab
const dragState = ref({
  isDragging: false,
  draggedIndex: -1,
  markerPosition: 0,
  targetIndex: -1,
})

watch(busMessageFile, (message) => {
  switch (message.text) {
    case 'open':
      openFile(message.filePath)
      break
    case 'save':
      saveCurrentFile()
      break
    case 'save-as':
      saveCurrentFile({ asNew: true })
      break
    case 'save-all':
      saveAllFiles()
      break
    case 'rename':
      renameCurrentFile()
      break
    case 'encrypt':
      saveCurrentFile({ ext: 'htmr' })
      break
    case 'save-decrypted':
      saveCurrentFile({ ext: 'html' })
      break
    case 'show-in-folder':
      openFolder(currentFile.value.path)
  }
})

watch(busMessageEditor, (message) => {
  switch (message.text) {
    case 'focus':
      getActiveEditorComponent().editor.commands.focus()
      break
    case 'start-search':
      getActiveEditorComponent().startSearch()
      break
    case 'stop-search':
      getActiveEditorComponent().stopSearch()
      break
  }
})

watch(activeTabName, (tabName) => {
  const fileId = tabName
  if (fileId !== currentFile.value.id) commit('FILE_SET_CURRENT', fileId)
})

watch(() => currentFile.value.id, async (fileId) => {
  if (!fileId) return

  // Read file if it's not done yet
  if (!currentFile.value.isReady) {
    const isSuccess = await dispatch('openFile', { fileId, filePath: currentFile.value.path })
    if (!isSuccess) return
  }

  // Activate tab
  activeTabName.value = fileId
  setWindowTitle(currentFile.value.name)
}, { immediate: true })

watch(() => filesSettings.value.autosave, (autosave) => {
  if (autosaveTimer.value) clearInterval(autosaveTimer.value)
  if (autosave > 0) autosaveTimer.value = setInterval(() => { saveAllFiles() }, autosave * 60000)
}, { immediate: true })

// Setup drag and drop handler for tabs
onMounted(() => {
  const setupDragHandler = (attempts = 0) => {
    tabsNav = document.querySelector('.file-tabs .el-tabs__nav')
    if (tabsNav) {
      useEventListener(tabsNav, 'mousedown', onTabMouseDown)
    } else if (attempts < 10) {
      setTimeout(() => setupDragHandler(attempts + 1), 50)
    }
  }
  setupDragHandler()
})

// =============================================================================
// IPC Handlers
// =============================================================================

handleOpenFiles((event, filePaths) => {
  filePaths.forEach((filePath, i) => {
    dispatch('addActiveFile', {
      filePath,
      setCurrent: i === filePaths.length - 1
    })
  })
})

handleSaveFile((event, { filePath }) => {
  dispatch('saveFile', {
    file: currentFile.value,
    filePath,
    content: getActiveEditorComponent().editor.getHTML(),
  })
})

handleOpenImage((event, image) => {
  getActiveEditorComponent().editor.chain().focus().setImage({ src: image }).run()
})

// =============================================================================
// General/File Shortcut Handlers
// =============================================================================

$Mousetrap.bindGlobal(['mod+n'], () => {
  if (allowShortcuts.value) dispatch('addNewActiveFile')
})
$Mousetrap.bindGlobal(['mod+o'], () => {
  if (allowShortcuts.value) openFile()
})
$Mousetrap.bindGlobal(['mod+s'], () => {
  if (allowShortcuts.value && currentFile.value.dataType) saveCurrentFile()
})
$Mousetrap.bindGlobal(['mod+alt+shift+s'], () => {
  if (allowShortcuts.value) saveAllFiles()
})
$Mousetrap.bindGlobal(['mod+r'], () => {
  if (allowShortcuts.value) renameCurrentFile()
})
$Mousetrap.bindGlobal(['mod+w'], () => {
  if (allowShortcuts.value) closeFile(currentFile.value)
})
$Mousetrap.bindGlobal(['mod+alt+e'], () => {
  if (allowShortcuts.value) commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'show-in-folder' } })
})
$Mousetrap.bindGlobal(['esc', 'escape'], () => {
  if (allowShortcuts.value) commit('BUS_ADD_MESSAGE', { section: 'editor', message: { text: 'stop-search' } })
})
// Editor shortcut handlers
$Mousetrap.bindGlobal(['mod+f'], () => {
  if (allowShortcuts.value && currentFile.value.dataType) commit('BUS_ADD_MESSAGE', { section: 'editor', message: { text: 'start-search' } })
})
$Mousetrap.bindGlobal(['mod+k'], () => {
  if (allowShortcuts.value) getActiveEditorComponent().showLinkEditor()
})

// =============================================================================
// Drag'n'drop Handlers for Tabs
// =============================================================================

function onTabMouseDown(event) {
  // Don't activate drag if only one tab or if clicking on close button
  if (activeFiles.value.length <= 1) return
  if (event.target.closest('.is-icon-close')) return

  // Find the clicked tab item
  const tabItem = event.target.closest('.el-tabs__item')
  if (!tabItem) return

  const handleMouseMove = (e) => {
    if (!dragState.value.isDragging) {
      const tabElements = Array.from(tabsNav.querySelectorAll('.el-tabs__item'))
      const draggedIndex = tabElements.indexOf(tabItem)
      if (draggedIndex === -1) return
      
      dragState.value.draggedIndex = draggedIndex
      dragState.value.isDragging = true
    }
    updateDropMarker(e)
  }

  const handleMouseUp = () => {
    if (dragState.value.isDragging) performDrop()

    // Cleanup
    dragState.value.isDragging = false
    dragState.value.draggedIndex = -1
    dragState.value.targetIndex = -1
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function updateDropMarker(event) {
  const tabElements = Array.from(tabsNav.querySelectorAll('.el-tabs__item'))
  if (!tabElements.length) return

  const containerRect = tabsNav.getBoundingClientRect()
  const mouseX = event.clientX

  // Find the closest tab and determine position
  let targetIndex = -1
  let markerX = 0

  for (let i = 0; i < tabElements.length; i++) {
    const tabRect = tabElements[i].getBoundingClientRect()
    const tabMidpoint = tabRect.left + tabRect.width / 2

    if (mouseX < tabMidpoint) {
      targetIndex = i
      markerX = tabRect.left - containerRect.left
      break
    }
  }

  // If no target found, place marker after last tab
  if (targetIndex === -1) {
    targetIndex = tabElements.length
    const lastTabRect = tabElements[tabElements.length - 1].getBoundingClientRect()
    markerX = lastTabRect.right - containerRect.left - 1
  }

  dragState.value.targetIndex = targetIndex
  dragState.value.markerPosition = Math.round(markerX)
}

function performDrop() {
  const { draggedIndex, targetIndex } = dragState.value
  if (targetIndex === -1 || draggedIndex === -1) return

  // Calculate actual target index (accounting for the removed item)
  let actualTargetIndex = targetIndex
  if (draggedIndex < targetIndex) {
    actualTargetIndex = targetIndex - 1
  }

  // Don't move if dropping in the same position
  if (draggedIndex === actualTargetIndex) return

  commit('FILE_MOVE_ACTIVE', { fromIndex: draggedIndex, toIndex: actualTargetIndex })
}

// =============================================================================

function onTabsEdit(tabName, action) {
  if (action === 'add') dispatch('addNewActiveFile')
  else if (action === 'remove') closeFile(getters.getActiveFileById(tabName))
}

function getActiveEditorComponent() {
  return editorsRefs.value.find(e => e.isActive)
}

function openFile(filePath) {
  if (filePath) dispatch('addActiveFile', { filePath, setCurrent: true })
  else setTimeout(openFileDialog) // avoid dialog issues on macOS
}

function saveCurrentFile({ asNew = false, ext } = {}) {
  const { name, path, isEdited } = currentFile.value

  const newPath = path && ext ? `${path.slice(0, -4)}${ext}` : path
  if (!asNew && !isEdited && path && path === newPath) {
    commit('BUS_ADD_MESSAGE', { section: 'notification', message: { text: 'File has no changes to save' } })
    return // same path & no changes of content or format -> saving is not required
  }

  if (path) { // file already exists
    if (asNew) {
      setTimeout(() => saveFileDialog({ filePath: path })) // avoid dialog issues on macOS
      return
    }
    dispatch('saveFile', {
      file: currentFile.value,
      filePath: newPath,
      content: getActiveEditorComponent().editor.getHTML(),
    })
  } else { // 1st save
    const newExt = filesSettings.value.encryptNewFiles ? 'htmr' : ext || 'html'
    setTimeout(() => saveFileDialog({ fileName: `${name}.${newExt}` })) // avoid dialog issues on macOS
  }
}

function saveAllFiles() {
  editorsRefs.value.forEach(fe => {
    if (!fe.file.path || !fe.file.isEdited) return // file should be already saved and have changes
    dispatch('saveFile', {
      file: fe.file,
      filePath: fe.file.path,
      content: fe.editor.getHTML()
    })
  })
}

function renameCurrentFile() {
  if (!currentFile.value.path) {
    commit('BUS_ADD_MESSAGE', { section: 'notification', message: { text: 'To rename a file, it should be saved first' } })
    return
  }
  ElMessageBox.prompt('', 'Rename File', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    inputValue: currentFile.value.name,
    inputValidator: name => name.length === 0 ? '' +
      'Empty name' : true
  }).then(result => {
    if (result.value === currentFile.value.name) return
    dispatch('renameFile', {
      file: currentFile.value,
      newFileName: result.value })
  }).catch(() => {}).finally(() => {
    commit('BUS_ADD_MESSAGE', { section: 'editor', message: { text: 'focus' } })
  })
}

function closeFile(file) {
  if (file.isEdited) {
    ElMessageBox.confirm(`File "${file.name}" was edited. <br>Are you sure you want to close it?`, 'Confirmation', {
      confirmButtonText: 'Close',
      cancelButtonText: 'Cancel',
      dangerouslyUseHTMLString: true,
      type: 'warning'
    }).then(() => {
      dispatch('closeFile', { fileId: file.id })
    }).catch(() => {
      commit('BUS_ADD_MESSAGE', { section: 'editor', message: { text: 'focus' } })
    })
  } else {
    dispatch('closeFile', { fileId: file.id })
  }
}
</script>

<style scoped>
.file-container {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.placeholder {
  position: absolute;
  width: 100%;
  height: 100%;
}

.file-changed-mark {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--ui-color-accent);
  opacity: 0.5;
}

.file-encrypted-mark {
  position: absolute;
  top: 0;
  left: 5px;
  opacity: 0.6;
}

.tab-drop-marker {
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  height: calc(var(--bar-height) - 1px);
  background-color: var(--ui-color-accent);
  pointer-events: none;
  z-index: 1001;
  transform: translateX(0);
  transition: transform 0.15s ease;
  will-change: transform;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.7s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
.file-tabs.el-tabs {
  height: 100%;
  border: none;
  box-shadow: none;

  .el-tabs__header {
    height: var(--bar-height);

    .el-tabs__item {
      position: relative;
      padding: 0 14px 0 18px !important;
      border-right-color: var(--ui-border-color);

      .el-icon.is-icon-close {
        color: var(--element-placeholder-color);
        transform: translateY(2px);

        &:hover {
          color: var(--element-bg-color);
        }
      }
    }
  }

  .el-icon.is-icon-plus {
    transform: none;
  }

  .el-tabs__content {
    padding: 0;
    width: 100%;
    height: calc(100% - var(--bar-height)); /* without .el-tabs__header */
  }

  .el-tab-pane {
    height: 100%;
  }

  .el-tabs__new-tab {
    font-size: 1em;
    margin: 0 5px 0 10px;
    height: 1.75em;
    width: 1.75em;
    outline: none;
  }

  .el-tabs__new-tab:hover {
    background-color: var(--ui-bg-color-primary);
  }

  .el-tabs__item.is-active, .el-tabs__item:hover {
    color: var(--ui-color-accent) !important;
  }

  .el-tabs__item:not(.is-active) {
    .file-changed-mark {
      opacity: 0.2;
    }
  }
}
</style>
