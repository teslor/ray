<template>
  <el-dialog
    v-model="showDialog"
    class="dialog-settings"
    title="Settings"
    width="65%"
    align-center
    :close-on-click-modal="true"
    @open="handleDialogOpen"
    @close="handleDialogClose"
  >
    <el-tabs v-model="activeTab" tab-position="left">
      <el-tab-pane label="General" name="general">
        <div class="setting">
          <div class="title"><label>Theme</label><div class="info">Select color theme</div></div>
          <el-select v-model="settings.general.theme" placeholder="Select">
            <el-option v-for="item in themes" :key="item" :value="item" />
          </el-select>
        </div>
        <div class="setting">
          <div class="title"><label>Interface scale</label><div class="info">Adjust scale (zoom level) for the app</div></div>
          <el-input-number v-model="settings.general.uiScale" controls-position="right" :min="50" :max="200" :step="5" step-strictly />
        </div>
      </el-tab-pane>
      <el-tab-pane label="Editor" name="editor">
        <div class="setting">
          <div class="title"><label>Font</label><div class="info">Set default font for editor text</div></div>
          <el-select v-model="settings.editor.font" placeholder="Select">
            <el-option v-for="item in defaultSettings.editor.fonts" :key="item" :value="item" />
          </el-select>
        </div>
        <div class="setting">
          <div class="title"><label>Font size</label><div class="info">Set default font size for editor text</div></div>
          <el-select v-model="settings.editor.fontSize" placeholder="Select">
            <el-option v-for="item in fontSizeItems" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="setting">
          <div class="title"><label>Font color</label><div class="info">Set default color for editor text (or use theme style)</div></div>
          <div class="group">
            <el-switch v-model="settings.editor.useThemeFontColor" size="large" inline-prompt active-text="Theme" inactive-text="Theme" />
            <el-color-picker v-model="settings.editor.fontColor" placement="bottom-end" :disabled="settings.editor.useThemeFontColor" />
          </div>
        </div>
        <div class="setting">
          <div class="title"><label>Background color</label><div class="info">Set color for editor background (or use theme style)</div></div>
          <div class="group">
            <el-switch v-model="settings.editor.useThemeBackgroundColor" size="large" inline-prompt active-text="Theme" inactive-text="Theme" />
            <el-color-picker v-model="settings.editor.backgroundColor" placement="bottom-end" :disabled="settings.editor.useThemeBackgroundColor" />
          </div>
        </div>
        <div class="setting">
          <div class="title"><label>Line height</label><div class="info">Adjust line spacing for editor text</div></div>
          <el-input-number v-model="settings.editor.lineHeight" controls-position="right" :min="1" :max="2.5" :step="0.1" />
        </div>
        <div class="setting">
          <div class="title">
            <label>Spellcheck</label>
            <div class="info">Enable/disable the spellchecker for current locale language</div>
          </div>
          <el-switch v-model="settings.editor.enableSpellChecker" size="large" />
        </div>
      </el-tab-pane>
      <el-tab-pane label="Files" name="files">
        <div class="setting">
          <div class="title">
            <label>Autosave changed files</label>
            <div class="info">Set automatic save interval for changed files</div>
          </div>
          <el-select v-model="settings.files.autosave" placeholder="Select">
            <el-option v-for="item in autoSaveItems" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="setting">
          <div class="title">
            <label>Content width</label>
            <div class="info">Set max content width when viewing a file in another app e.g. a browser</div>
          </div>
          <el-select v-model="settings.files.contentWidth" placeholder="Select">
            <el-option v-for="item in contentWidthItems" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="setting">
          <div class="title">
            <label>Encrypt new files</label>
            <div class="info">Encrypt files on first save by default</div>
          </div>
          <el-switch v-model="settings.files.encryptNewFiles" size="large" />
        </div>
        <div class="setting">
          <div class="title">
            <label>Use single secret phrase</label>
            <div class="info">Whenever possible, use the latest entered secret phrase to open/save encrypted files</div>
          </div>
          <el-switch v-model="settings.files.useSinglePassword" size="large" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="footer">
        <div>
          <el-button class="icon-button" type="primary" @click="openFolder()">
            <icon-folder-share :size="21" :stroke="1.5" />
          </el-button>
        </div>
        <div>
          <el-button class="action-button" type="primary" size="default" @click="handleResetClick">Reset</el-button>
          <el-button class="action-button" type="primary" size="default" @click="handleApplyClick">Apply</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useStore } from 'vuex'
import IconFolderShare from '@tabler-icons/IconFolderShare.mjs'
import defaultSettings from '../assets/json/defaultSettings.json'
const { state, commit, dispatch } = useStore()
const { getThemes, openFolder } = window.electronAPI

const showDialog = ref(false)
const activeTab = ref('editor')
const settings = reactive({
  general: {
    theme: '',
    uiScale: 0
  },
  editor: {
    font: '',
    fontSize: 0,
    fontColor: '',
    useThemeFontColor: true,
    backgroundColor: '',
    useThemeBackgroundColor: true,
    lineHeight: 0,
    enableSpellChecker: true
  },
  files: {
    autosave: 0,
    encryptNewFiles: 0,
    useSinglePassword: 0,
    contentWidth: 0
  }
})

let themes = []
const fontSizeItems = [
  { value: 14, label: '14 px' },
  { value: 16, label: '16 px' },
  { value: 18, label: '18 px' },
  { value: 20, label: '20 px' },
  { value: 22, label: '22 px' },
  { value: 24, label: '24 px' }
]
const autoSaveItems = [
  { value: 0, label: 'Disabled' },
  { value: 2, label: 'Every 2 min' },
  { value: 5, label: 'Every 5 min' },
  { value: 10, label: 'Every 10 min' },
  { value: 20, label: 'Every 20 min' }
]
const contentWidthItems = [
  { value: 0, label: 'Max' },
  { value: 800, label: '800 px' },
  { value: 1000, label: '1000 px' },
  { value: 1200, label: '1200 px' },
  { value: 1600, label: '1600 px' }
]

const isDialogVisible = computed(() => state.view.dialogSettings.visible)

watch(isDialogVisible, (visible) => {
  showDialog.value = visible
})

watch(showDialog, (show) => {
  commit('VIEW_TOGGLE_DIALOG_SETTINGS', show)
})

watch(() => state.settings.general.uiScale, (uiScale) => {
  settings.general.uiScale = uiScale
})

async function handleDialogOpen() {
  // Get settings from the store state
  Object.keys(settings).forEach(section => {
    Object.keys(settings[section]).forEach(key => {
      settings[section][key] = state.settings[section][key]
    })
  })
  // Get theme list
  if (!themes.length) themes = await getThemes()
}

function handleDialogClose() {
  commit('BUS_ADD_MESSAGE', { section: 'editor', message: { text: 'focus' } })
}

function handleApplyClick() {
  // Define updated settings
  const updatedSettings = {}
  Object.keys(settings).forEach(section => {
    Object.keys(settings[section]).forEach(key => {
      if (settings[section][key] !== state.settings[section][key]) {
        if (!updatedSettings[section]) updatedSettings[section] = {}
        updatedSettings[section][key] = settings[section][key]
      }
    })
  })
  if (!Object.keys(updatedSettings).length) return // no changes

  dispatch('updateSettings', { settings: updatedSettings })
  commit('VIEW_TOGGLE_DIALOG_SETTINGS', false)
}

function handleResetClick() {
  Object.keys(settings[activeTab.value]).forEach(key => {
    if (defaultSettings[activeTab.value][key] !== undefined) settings[activeTab.value][key] = defaultSettings[activeTab.value][key]
  })
}
</script>

<style scoped>
.el-tabs {
  width: 100%;
}

.setting {
  --input-width: 140px;

  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;

  .title {
    max-width: calc(96% - var(--input-width))
  }

  label {
    color: var(--ui-color-accent);
    font-size: 16px;
    text-wrap: nowrap;
  }

  .info {
    margin-top: 4px;
    opacity: 0.8;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .group {
    display: flex;

    &  > :first-child {
      margin-right: 1em;
    }
  }

  .el-select, .el-input-number {
    width: var(--input-width);
    flex-shrink: 0;
  }

  & + & {
    padding-top: 12px;
    border-top: 1px solid var(--ui-border-color)
  }
}

.footer {
  display: flex;
  justify-content: space-between;
}

.icon-button {
  width: 46px;
  height: 36px;
  padding: 0;
}

.action-button {
  width: 80px;
  height: 36px;
}
</style>

<style>
.dialog-settings {
  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    height: 80vh;
    flex: 1;
    display: flex;
  }

  .el-tabs__content {
    padding: 12px 0 0 12px;
  }

  .el-tabs__item {
    font-size: 17px;
  }
}
</style>
