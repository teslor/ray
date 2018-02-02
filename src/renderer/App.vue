<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
  import { remote, ipcRenderer as ipc } from 'electron'
  import { mapState } from 'vuex'

  export default {
    name: 'Ray',

    data () {
      return {
        mainWindow: remote.getCurrentWindow()
      }
    },

    computed: {
      ...mapState({
        busMessageNotification: state => state.bus.notification
      })
    },

    watch: {
      busMessageNotification (message) {
        if (!message) return
        this.$message({
          message: message.text,
          type: message.type ? message.type : 'info'
        })
      }
    },

    created () {
      this.$store.dispatch('loadAppConfig')
    },

    mounted () {
      // ********** Global event listeners **********

      // Shortcut handlers
      this.$Mousetrap.bindGlobal(['f11'], () => {
        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
      })

      // Prevent dropped file from opening in window
      document.addEventListener('dragover', function (event) {
        event.preventDefault()
        return false
      }, false)
      document.addEventListener('drop', function (event) {
        event.preventDefault()
        return false
      }, false)

      ipc.on('request-close-app', () => {
        const i = this.$store.state.activeFiles.findIndex(file => file.flags.wasChanged)

        // No changes in files
        if (i === -1) {
          this.closeApp()
          return
        }

        this.$confirm('You probably have some unsaved data. <br>Are you sure you want to quit?', 'Confirmation', {
          confirmButtonText: 'Quit',
          cancelButtonText: 'Cancel',
          dangerouslyUseHTMLString: true,
          type: 'warning'
        }).then(() => {
          this.closeApp()
        }).catch(() => {})
      })
    },

    methods: {
      async closeApp () {
        await this.$store.dispatch('saveAppConfig')
        this.mainWindow.allowClose = true
        this.mainWindow.close()
      }
    }
  }
</script>

<style>
  @import './assets/styles/quill/quill.snow.css';
  @import './assets/styles/vars.css';

  /********** Main global styles **********/

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: system-ui;
  }

  /********** Additional global styles **********/

  .markedText {
    background-color: aquamarine;
    font-style: inherit;
  }

  i {
    font-size: 16px;
  }

  /********** Electron-UI styles ***********/

  .el-message__content {
    font-size: 15px;
  }

  .el-dropdown-menu.el-popper {
    padding: 0;
    margin-top: 5px;
  }

  /*.el-tooltip__popper {*/
    /*color: #575757 !important;*/
    /*border: 1px solid silver !important;*/
  /*}*/

  /*.popper__arrow {*/
    /*border-bottom-color: silver !important;*/
  /*}*/
</style>
