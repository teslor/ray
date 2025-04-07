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
  </div>
</template>

<script setup>
import { inject, useTemplateRef, ref, computed, watch } from 'vue'
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
    case 'focus': getActiveEditorComponent().editor.commands.focus()
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

// IPC handlers
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

// General/file shortcut handlers
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
  if (allowShortcuts.value && currentFile.value.isSearchMode) {
    commit('FILE_SET_SEARCH_MODE', { fileId: currentFile.value.id, value: false })
  }
})
// Editor shortcut handlers
$Mousetrap.bindGlobal(['mod+f'], () => {
  if (allowShortcuts.value && currentFile.value.dataType) commit('FILE_SET_SEARCH_MODE', { fileId: currentFile.value.id })
})
$Mousetrap.bindGlobal(['mod+k'], () => {
  if (allowShortcuts.value) getActiveEditorComponent().showLinkEditor()
})

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
  opacity: 0.4;
}

.file-encrypted-mark {
  position: absolute;
  top: 0;
  left: 5px;
  opacity: 0.6;
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

    .file-changed-mark {
      background-color: var(--ui-color-accent);
    }
  }
}
</style>
