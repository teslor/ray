<template>
  <el-dialog
      class="ds-dialog"
      title="Settings"
      :visible="displayDialog"
      :close-on-click-modal="true"
      :before-close="hideDialog"
      width="460px"
      @open="handleDialogOpen">

    <el-tabs v-model="activeTab">
      <el-tab-pane label="Editor" name="editor">
        <el-form class="ds-form" :model="settings.editor" label-width="200px">
          <el-form-item label="Main Font">
            <el-select size="medium" v-model="settings.editor.mainFont" placeholder="Select">
              <el-option v-for="item in fontItems" :key="item" :value="item"/>
            </el-select>
          </el-form-item>
          <el-form-item label="Base Font Size">
            <el-select size="medium" v-model="settings.editor.baseFontSize" placeholder="Select">
              <el-option v-for="item in fontSizeItems" :key="item.value" :label="item.label" :value="item.value"/>
            </el-select>
          </el-form-item>
          <el-form-item label="Font Color">
            <el-color-picker size="medium" v-model="settings.editor.fontColor"/>
          </el-form-item>
          <el-form-item label="Background Color">
            <el-color-picker size="medium" v-model="settings.editor.backgroundColor"/>
          </el-form-item>
          <el-form-item label="Line Height">
            <el-input-number size="medium" v-model="settings.editor.lineHeight" controls-position="right" :min="1" :max="2.5" :step="0.1"/>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="Files" name="files">
        <el-form class="ds-form" :model="settings.files" label-width="200px">
          <el-form-item label="Autosave Changed Files">
            <el-select size="medium" v-model="settings.files.autosave" placeholder="Select">
              <el-option v-for="item in autoSaveItems" :key="item.value" :label="item.label" :value="item.value"/>
            </el-select>
          </el-form-item>
          <el-form-item label="Content Width">
            <el-select size="medium" v-model="settings.files.contentWidth" placeholder="Select">
              <el-option v-for="item in contentWidthItems" :key="item.value" :label="item.label" :value="item.value"/>
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <div slot="footer" class="dialog-footer">
      <div>
        <el-button class="dialog-icon-button" type="primary" @click="handleShowInExplorerClick"><i class="fas fa-external-link-alt"></i></el-button>
      </div>
      <div>
        <el-button type="primary" size="medium" @click="handleResetClick">Reset</el-button>
        <el-button type="primary" size="medium" @click="handleApplyClick">Apply</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
  import { mapState } from 'vuex'
  import { defaultValues } from '../utils'

  export default {
    name: 'dialog-settings',

    data () {
      return {
        activeTab: 'editor',

        fontItems: ['Auto', 'Helvetica', 'Roboto', 'Verdana'],
        fontSizeItems: [
          { value: 14, label: '14 px' },
          { value: 16, label: '16 px' },
          { value: 18, label: '18 px' },
          { value: 20, label: '20 px' },
          { value: 22, label: '22 px' },
          { value: 24, label: '24 px' }
        ],
        autoSaveItems: [
          { value: 0, label: 'Disabled' },
          { value: 2, label: 'Every 2 min' },
          { value: 5, label: 'Every 5 min' },
          { value: 10, label: 'Every 10 min' },
          { value: 20, label: 'Every 20 min' }
        ],
        contentWidthItems: [
          { value: 0, label: 'Max' },
          { value: 800, label: '800 px' },
          { value: 1000, label: '1000 px' },
          { value: 1200, label: '1200 px' },
          { value: 1600, label: '1600 px' }
        ],

        settings: {
          editor: {
            mainFont: '',
            baseFontSize: 0,
            fontColor: '',
            backgroundColor: '',
            lineHeight: 0
          },
          files: {
            autosave: 0,
            contentWidth: 0
          }
        }
      }
    },

    computed: {
      ...mapState({
        displayDialog: state => state.view.dialogSettings.visible
      })
    },

    methods: {
      hideDialog () {
        this.$store.commit('VIEW_TOGGLE_DIALOG_SETTINGS', false)
      },
      handleDialogOpen () {
        Object.keys(this.settings).forEach(section => {
          Object.keys(this.settings[section]).forEach(key => {
            this.settings[section][key] = this.$store.state.settings[section][key]
          })
        })
      },
      handleShowInExplorerClick () {
        const appConfig = this.$electron.remote.getGlobal('config')
        if (appConfig) this.$electron.shell.showItemInFolder(appConfig.path)
      },
      handleApplyClick () {
        this.$store.dispatch('updateSettings', {
          settings: {
            editor: this.settings.editor,
            files: this.settings.files
          }
        })
        this.hideDialog()
      },
      handleResetClick () {
        Object.keys(this.settings[this.activeTab]).forEach(key => {
          if (defaultValues[this.activeTab][key]) this.settings[this.activeTab][key] = defaultValues[this.activeTab][key]
        })
      }
    }
  }
</script>

<style>
  .ds-dialog {
    & .dialog-footer {
      display: flex;
      justify-content: space-between;
    }

    & .dialog-icon-button {
      width: 46px;
      height: 36px;
      padding: 0;
    }

    & .el-tabs__content {
      min-height: 210px;
    }
  }

  .ds-form {
    & .el-form-item__content {
      display: flex;
    }

    & .el-select, & .el-input-number {
      width: 130px;
    }
  }
</style>
