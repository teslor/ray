<template>
  <div class="action-bar">
    <div class="bar-section">
      <div class="button-group">
        <el-button class="bar-button" :class="{ highlighted: isSidebarVisible }" @click="toggleSidebar">
          <icon-menu2 :size="iconSize" :stroke="iconStroke" />
        </el-button>
        <el-button class="bar-button" @click="createProject">
          <icon-square-plus :size="iconSize" :stroke="iconStroke" />
        </el-button>
        <el-button class="bar-button" @click="showProjectList">
          <icon-layout-list :size="iconSize" :stroke="iconStroke" />
        </el-button>
      </div>

      <div class="button-group">
        <el-button class="bar-button" :disabled="!currentFile.path || !currentProject.name" @click="addFileToProject">
          <icon-file-arrow-left :size="iconSize" :stroke="iconStroke" />
        </el-button>
        <el-button class="bar-button" :disabled="!currentFile.path" @click="showFileInExplorer">
          <icon-folder-share :size="iconSize" :stroke="iconStroke" />
        </el-button>

        <el-dropdown
          class="bar-dropdown"
          placement="bottom-start"
          trigger="click"
          :show-timeout="0"
          split-button
          @click="openFile"
          @command="openFileByPath"
        >
          <icon-folder :size="iconSize" :stroke="iconStroke" />

          <template #dropdown>
            <el-dropdown-menu>
              <template v-if="recentFiles.length > 0">
                <el-dropdown-item v-for="file in recentFiles" :key="file.path" :command="file.path">{{ file.name }}</el-dropdown-item>
              </template>
              <el-dropdown-item v-else disabled>No Recent Files</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown
          v-show="currentFile.dataType || !currentFile.isReady"
          class="bar-dropdown"
          placement="bottom-start"
          trigger="click"
          :show-timeout="0"
          split-button
          @click="saveFile"
          @command="handleSaveClick"
        >
          <icon-file-download :size="iconSize" :stroke="iconStroke" />

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="saveFileAs">Save File As</el-dropdown-item>
              <el-dropdown-item command="saveAllFiles">Save All Files</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown
          v-show="currentFile.dataType || !currentFile.isReady"
          class="bar-dropdown"
          placement="bottom-start"
          trigger="click"
          :show-timeout="0"
          split-button
          @click="renameFile"
          @command="handleEncryptClick"
        >
          <icon-file-pencil :size="iconSize" :stroke="iconStroke" />

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="encrypt" :disabled="currentFile.isEncrypted">Encrypt File</el-dropdown-item>
              <el-dropdown-item command="saveDecrypted" :disabled="!currentFile.isEncrypted">Save Decrypted File</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button v-show="currentFile.dataType || !currentFile.isReady" class="bar-button" :class="{ highlighted: currentFile.isSearchMode }" @click="toggleSearch">
          <icon-search :size="iconSize" :stroke="iconStroke" />
        </el-button>
      </div>
    </div>

    <div class="bar-section">
      <el-button class="bar-button" @click="showSettingsDialog"><icon-settings :size="iconSize" :stroke="iconStroke" /></el-button>
      <el-button class="bar-button" @click="showHelpDialog"><icon-help-octagon :size="iconSize" :stroke="iconStroke" /></el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import IconMenu2 from '@tabler-icons/IconMenu2.mjs'
import IconSquarePlus from '@tabler-icons/IconSquarePlus.mjs'
import IconLayoutList from '@tabler-icons/IconLayoutList.mjs'
import IconFileArrowLeft from '@tabler-icons/IconFileArrowLeft.mjs'
import IconFolderShare from '@tabler-icons/IconFolderShare.mjs'
import IconFolder from '@tabler-icons/IconFolder.mjs'
import IconFileDownload from '@tabler-icons/IconFileDownload.mjs'
import IconFilePencil from '@tabler-icons/IconFilePencil.mjs'
import IconSearch from '@tabler-icons/IconSearch.mjs'
import IconSettings from '@tabler-icons/IconSettings.mjs'
import IconHelpOctagon from '@tabler-icons/IconHelpOctagon.mjs'
const { state, commit } = useStore()

const iconSize = 22
const iconStroke = 1.5

const currentProject = computed(() => state.currentProject)
const currentFile = computed(() => state.currentFile)
const recentFiles = computed(() => state.recentFiles)
const isSidebarVisible = computed(() => state.view.sidebar.visible)

function toggleSidebar() {
  commit('VIEW_TOGGLE_SIDEBAR')
}
function createProject() {
  commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'create' } })
}
function showProjectList() {
  commit('VIEW_TOGGLE_DIALOG_PROJECTS', true)
}
function openFile() {
  commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'open' } })
}
function openFileByPath(filePath) { // open recent file
  commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'open', filePath } })
}
function saveFile() {
  commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'save' } })
}
function handleSaveClick(cmd) {
  if (cmd === 'saveFileAs') {
    commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'save-as' } })
  } else if (cmd === 'saveAllFiles') {
    commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'save-all' } })
  }
}
function renameFile() {
  commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'rename' } })
}
function handleEncryptClick(cmd) {
  if (cmd === 'encrypt') {
    commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'encrypt' } })
  } else if (cmd === 'saveDecrypted') {
    commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'save-decrypted' } })
  }
}
function addFileToProject() {
  commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'add-files', filePath: currentFile.value.path } })
}
function showFileInExplorer() {
  commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'show-in-folder' } })
}
function toggleSearch() {
  commit('FILE_SET_SEARCH_MODE', { fileId: currentFile.value.id })
}
function showSettingsDialog() {
  commit('VIEW_TOGGLE_DIALOG_SETTINGS', true)
}
function showHelpDialog() {
  commit('VIEW_TOGGLE_DIALOG_HELP', true)
}
</script>

<style scoped>
.action-bar {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
  height: var(--action-bar-height);
  padding: 0 4px;
  background-color: var(--bg-color);
  border-top: 1px solid var(--border-color);
}

.bar-section {
  display: flex;

  &:last-child {
    margin-left: 16px;
  }
}

.button-group {
  display: flex;

  &:not(:first-child) {
    margin-left: 16px;
  }
}

.bar-button, .bar-dropdown {
  -webkit-app-region: no-drag;
}

.bar-dropdown + .bar-dropdown, .bar-dropdown + .bar-button, .bar-button + .bar-dropdown, .bar-button + .bar-button {
  margin-left: 2px !important;
}
</style>

<style>
.action-bar {
  -webkit-app-region: drag;

  .el-button-group {
    display: flex;
  }

  .el-button {
    padding: 0;
    width: 40px;
    height: 30px;
    background-color: var(--button-bg-color);
    border-color: var(--button-border-color) !important;
    color: var(--button-text-color);
  }

  .el-button:focus {
    background-color: var(--button-bg-color);
    color: var(--button-text-color);
  }

  .el-button:hover {
    background-color: var(--button-hover-bg-color);
    color: var(--button-text-color);
  }

  .el-button.highlighted {
    background-color: var(--button-highlight-color);
  }

  .el-button.is-disabled {
    background-color: var(--button-disabled-bg-color) !important;
    color: var(--button-disabled-text-color) !important;
  }

  .el-dropdown {
    .el-dropdown__caret-button {
      width: 30px;
    }
  }
}
</style>
