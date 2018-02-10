<template>
  <el-dialog
      class="ds-dialog"
      title="Settings"
      :visible="displayDialog"
      :close-on-click-modal="true"
      :before-close="hideDialog"
      width="450px"
      @open="handleDialogOpen">
    <el-form class="ds-form" :model="editorSettings" label-width="180px">
      <el-form-item label="Main Font">
        <el-select class="form-select" v-model="editorSettings.mainFont" placeholder="Select Font">
          <el-option v-for="item in fonts" :key="item" :value="item"/>
        </el-select>
      </el-form-item>
      <el-form-item label="Base Font Size">
        <el-select class="form-select" v-model="editorSettings.baseFontSize" placeholder="Select Font Size">
          <el-option v-for="item in fontSizes" :key="item" :value="item"/>
        </el-select>
      </el-form-item>
      <el-form-item label="Font Color">
        <el-color-picker v-model="editorSettings.fontColor"/>
      </el-form-item>
      <el-form-item label="Background Color">
        <el-color-picker v-model="editorSettings.backgroundColor"/>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <div>
        <el-button class="dialog-icon-button" type="primary" @click="handleShowInExplorerClick"><i class="fas fa-external-link-alt"></i></el-button>
      </div>
      <div>
        <el-button type="primary" @click="handleResetClick">Reset</el-button>
        <el-button type="primary" @click="handleApplyClick">Apply</el-button>
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
        fonts: ['Auto', 'Helvetica', 'Roboto', 'Verdana'],
        fontSizes: ['14 px', '16 px', '18 px', '20 px', '22 px', '24 px'],
        editorSettings: {
          mainFont: '',
          baseFontSize: '',
          fontColor: '',
          backgroundColor: ''
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
        Object.keys(this.editorSettings).forEach(key => {
          this.editorSettings[key] = this.$store.state.settings.editor[key]
        })
      },
      handleShowInExplorerClick () {
        const appConfig = this.$electron.remote.getGlobal('config')
        if (!appConfig) return
        this.$electron.shell.showItemInFolder(appConfig.path)
      },
      handleApplyClick () {
        this.$store.dispatch('updateSettings', {
          settings: {
            editor: this.editorSettings
          }
        })
        this.hideDialog()
      },
      handleResetClick () {
        Object.keys(this.editorSettings).forEach(key => {
          if (defaultValues[key]) this.editorSettings[key] = defaultValues[key]
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

    & .form-select {
      width: 120px;
    }
  }

  .ds-dialog {
    & .dialog-footer {
      display: flex;
      justify-content: space-between;
    }

    & .dialog-icon-button {
      width: 50px;
      height: 40px;
      padding: 0;
    }
  }
</style>
