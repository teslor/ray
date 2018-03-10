<template>
  <el-dialog
      class="ds-dialog"
      title="Settings"
      :visible="displayDialog"
      :close-on-click-modal="true"
      :before-close="hideDialog"
      width="450px"
      @open="handleDialogOpen">

    <el-tabs v-model="activeTab">
      <el-tab-pane label="Editor" name="editor">
        <el-form class="ds-form" :model="settings.editor" label-width="180px">
          <el-form-item label="Main Font">
            <el-select size="medium" v-model="settings.editor.mainFont" placeholder="Select">
              <el-option v-for="item in fonts" :key="item" :value="item"/>
            </el-select>
          </el-form-item>
          <el-form-item label="Base Font Size">
            <el-select size="medium" v-model="settings.editor.baseFontSize" placeholder="Select">
              <el-option v-for="item in fontSizes" :key="item" :value="item"/>
            </el-select>
          </el-form-item>
          <el-form-item label="Font Color">
            <el-color-picker size="medium" v-model="settings.editor.fontColor"/>
          </el-form-item>
          <el-form-item label="Background Color">
            <el-color-picker size="medium" v-model="settings.editor.backgroundColor"/>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="Files" name="files">
        <el-form class="ds-form" :model="settings.files" label-width="180px">
          <el-form-item label="Content Width">
            <el-select size="medium" v-model="settings.files.contentWidth" placeholder="Select">
              <el-option v-for="item in contentWidths" :key="item" :value="item"/>
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

        fonts: ['Auto', 'Helvetica', 'Roboto', 'Verdana'],
        fontSizes: ['14 px', '16 px', '18 px', '20 px', '22 px', '24 px'],
        contentWidths: ['Max', '800 px', '1000 px', '1200 px', '1600 px'],

        settings: {
          editor: {
            mainFont: '',
            baseFontSize: '',
            fontColor: '',
            backgroundColor: ''
          },
          files: {
            contentWidth: ''
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
  .ds-form {
    & .el-form-item__content {
      display: flex;
    }

    & .el-select, & .el-input-number {
      width: 120px;
    }
  }

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
</style>
