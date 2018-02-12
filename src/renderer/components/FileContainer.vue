<template>
  <div class="fc-wrapper" ref="ref_wrapper">
    <el-tabs
        class="fc-tabs"
        type="border-card"
        editable
        :value="currentFile.id"
        @edit="handleTabsEdit"
        @tab-click="handleTabClick">
      <el-tab-pane
          v-for="file in activeFiles"
          :label="file.name"
          :name="file.id"
          :key="file.id"
          :data-file-id="file.id"
          closable>
        <file-editor
            v-if="file.dataType"
            ref="ref_editors"
            :file="file"
            :active="file.id === currentFile.id">
        </file-editor>
        <file-viewer
            v-else
            :file="file"
            :active="file.id === currentFile.id"/>
        <!--<file-viewer></file-viewer>-->
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
  import { ipcRenderer as ipc } from 'electron'
  import { mapState, mapGetters } from 'vuex'
  import FileEditor from './FileEditor'
  import FileViewer from './FileViewer'

  export default {
    name: 'file-container',
    components: { FileEditor, FileViewer },

    data () {
      return {
        tabsElement: null,
        tabsHeaderElement: null
      }
    },

    computed: {
      ...mapState({
        currentFile: state => state.currentFile,
        activeFiles: state => state.activeFiles,
        busMessageFile: state => state.bus.file
      }),
      ...mapGetters([
        'allowShortcuts'
      ])
    },

    watch: {
      busMessageFile (message) {
        if (!message) return
        switch (message.text) {
          case 'save-current':
            this.saveCurrentFile()
            break
          case 'show-in-folder':
            this.$electron.shell.showItemInFolder(this.currentFile.path)
        }
      }
    },

    mounted () {
      // Cache elements
      this.tabsElement = this.$refs.ref_wrapper.querySelector('.el-tabs')
      this.tabsHeaderElement = this.$refs.ref_wrapper.querySelector('.el-tabs__header')

      // IPC handlers
      ipc.on('open-file', (event, files) => {
        if (!files) return
        files.forEach((file, i) => {
          this.$store.dispatch('openFile', {
            filePath: file,
            setCurrent: i === files.length - 1
          })
        })
      })

      ipc.on('save-file', (event, path) => {
        if (!path) return
        const currentEditor = this.getActiveEditorComponent().editor
        this.$store.dispatch('saveFile', {
          file: this.currentFile,
          filePath: path,
          contents: currentEditor.root.innerHTML
        })
      })

      // Open external links in browser & file links in the app
      this.$refs.ref_wrapper.addEventListener('click', (e) => {
        const elem = e.target
        if (elem.tagName !== 'A' || !elem.classList.contains('ql-preview')) return
        e.preventDefault()
        if (elem.href.startsWith('file://')) {
          this.$store.dispatch('openFile', { filePath: elem.href, setCurrent: true })
        } else {
          this.$electron.shell.openExternal(elem.href)
        }
      })

      // Shortcut handlers
      this.$Mousetrap.bindGlobal(['command+n', 'ctrl+n'], () => {
        if (this.allowShortcuts) this.$store.dispatch('createNewFile')
      })
      this.$Mousetrap.bindGlobal(['command+o', 'ctrl+o'], () => {
        if (this.allowShortcuts) ipc.send('open-file-dialog')
      })
      this.$Mousetrap.bindGlobal(['command+s', 'ctrl+s'], () => {
        if (this.allowShortcuts && this.currentFile.dataType) this.saveCurrentFile()
      })
      this.$Mousetrap.bindGlobal(['command+w', 'ctrl+w'], () => {
        if (this.allowShortcuts) this.closeFile(this.currentFile)
      })
      this.$Mousetrap.bindGlobal(['command+f', 'ctrl+f'], () => {
        if (this.allowShortcuts && this.currentFile.dataType) this.$store.commit('FILE_SET_SEARCH_MODE', { fileId: this.currentFile.id })
      })
      this.$Mousetrap.bindGlobal(['command+shift+e', 'ctrl+shift+e'], () => {
        if (this.allowShortcuts) this.$store.commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'show-in-folder' } })
      })
    },

    methods: {
      getActiveEditorComponent () {
        return this.$refs.ref_editors.find(e => e.active)
      },
      saveCurrentFile () {
        if (this.currentFile.path) {
          const currentEditor = this.getActiveEditorComponent().editor
          this.$store.dispatch('saveFile', {
            file: this.currentFile,
            filePath: this.currentFile.path,
            contents: currentEditor.root.innerHTML
          })
        } else ipc.send('save-file-dialog')
      },
      closeFile (file) {
        if (file.flags.wasChanged) {
          this.$confirm(`File "${file.name}" was edited. <br>Are you sure you want to close it?`, 'Confirmation', {
            confirmButtonText: 'Close',
            cancelButtonText: 'Cancel',
            dangerouslyUseHTMLString: true,
            type: 'warning'
          }).then(() => {
            this.$store.dispatch('closeFile', { fileId: file.id })
          }).catch(() => {})
        } else {
          this.$store.dispatch('closeFile', { fileId: file.id })
        }
      },

      // ********** Handlers **********

      handleTabClick (tab) {
        const fileId = tab.$el.getAttribute('data-file-id')
        if (fileId !== this.currentFile.id) this.$store.commit('FILE_SET_CURRENT', tab.$el.getAttribute('data-file-id'))
      },
      handleTabsEdit (tabName, action) {
        if (action === 'add') {
          this.$store.dispatch('createNewFile')
        } else if (action === 'remove') {
          this.closeFile(this.$store.getters.getActiveFileById(tabName))
        }
      }
    }
  }
</script>

<style>
  @import '../assets/styles/vars.css';

  .fc-wrapper {
    flex: 1;
    user-select: none;
    min-width: 1px; /* prevent .el-tabs__header growth */
  }

  .fc-tabs {
    height: 100%;
    border: none;
    box-shadow: none;

    & .el-icon-plus {
      transform: none;
    }

    & .el-tabs__content {
      padding: 0;
      width: 100%;
      height: calc(100% - 40px); /* without .el-tabs__header */
    }

    & .el-tab-pane {
      height: 100%;
    }

    & .el-tabs__new-tab {
      border: 1px solid var(--theme-color-1-l60);
      color: var(--theme-color-1-l60);
      font-size: 14px;
      margin: 5px 4px 0 10px;
      height: 28px;
      width: 28px;
      line-height: 28px;
      outline: none;
    }

    & .el-tabs__new-tab:hover {
      background-color: var(--theme-color-1-l94);
      color: #555;
    }

    & .el-tabs__new-tab:focus {
      background-color: #ceeefd;
    }

    & .el-tabs__item.is-active, & .el-tabs__item:hover {
      color: var(--theme-color-2) !important;
    }
  }
</style>
