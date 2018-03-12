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

      const fsShortcut = process.platform === 'darwin' ? 'ctrl+command+f' : 'f11'
      this.$Mousetrap.bindGlobal([fsShortcut], () => {
        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
      })

      this.$Mousetrap.bindGlobal(['command+q'], (event) => {
        event.preventDefault()
        this.confirmQuit(true)
      })

      ipc.on('request-close-window', () => {
        this.confirmQuit()
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
    },

    methods: {
      confirmQuit (forceQuit) {
        const i = this.$store.state.activeFiles.findIndex(file => file.flags.wasChanged)

        // No changes in files
        if (i === -1) {
          this.quitApp(forceQuit)
          return
        }

        this.$confirm('You probably have some unsaved data. <br>Are you sure you want to quit?', 'Confirmation', {
          confirmButtonText: 'Quit',
          cancelButtonText: 'Cancel',
          dangerouslyUseHTMLString: true,
          type: 'warning'
        }).then(() => {
          this.quitApp(forceQuit)
        }).catch(() => {})
      },
      async quitApp (forceQuit) {
        await this.$store.dispatch('saveAppConfig')
        ipc.send(forceQuit ? 'quit-app' : 'close-window')
      }
    }
  }
</script>

<style>
  @import './assets/styles/vars.css';
  @import './assets/styles/quill/quill.snow.css';

  /********** Main global styles **********/

  html {
    box-sizing: border-box;
  }
  *, *:before, *:after {
    box-sizing: inherit;
  }

  body {
    user-select: none;
    margin: 0;
  }

  body, input, textarea, select, button {
    font-family: var(--font-family-1);
  }

  h1, h2, h3, h4, h5, p, blockquote, figure, ol, ul {
    margin: 0;
    padding: 0;
  }

  div {
    cursor: default;
  }

  /********** Additional global styles **********/

  .markedText {
    background-color: aquamarine;
    font-style: inherit;
  }

  i {
    font-size: 16px;
  }

  /********** Element-UI overrides ***********/

  .el-button {
    font-weight: 400;
  }

  .el-dialog__body {
    padding: 20px;

    & .el-tabs__item {
      transform: translateZ(0);
    }
  }

  .el-select-dropdown__item.selected {
    font-weight: 500;
  }

  .el-form-item {
    margin-bottom: 15px;
  }

  .el-form-item__label {
    line-height: 36px;
  }

  .el-form-item__content {
    line-height: 36px;
  }

  .el-message__content {
    font-size: 15px;
  }

  .el-dropdown-menu.el-popper {
    padding: 0;
    margin-top: 5px;
  }
</style>
