<template>
  <div class="pc-wrapper" :style="sidebarStyle">
    <div class="pc-elements">
      <div v-if="currentProject.name" class="pc-title" >{{ currentProject.name }}</div>
      <el-button v-else class="pc-button" type="primary" plain @click="createProject">Create a Project</el-button>
      <project-tree v-show="currentProject.name" :project="currentProject" ref="ref_tree"/>
    </div>
    <div class="pc-divider"></div>
  </div>
</template>

<script>
  import { ipcRenderer as ipc } from 'electron'
  import { mapState, mapGetters } from 'vuex'
  import $ from 'jquery'
  import 'jquery-resizable-dom'
  import throttle from 'lodash/throttle'
  import ProjectTree from './ProjectTree'

  export default {
    name: 'project-container',
    components: { ProjectTree },

    computed: {
      ...mapState({
        projects: state => state.projects,
        currentProject: state => state.currentProject,
        currentFile: state => state.currentFile,
        busMessageProject: state => state.bus.project,
        sidebarStyle (state) {
          const sidebarWidth = state.view.sidebar.width
          return sidebarWidth ? { width: `${sidebarWidth}px` } : null
        }
      }),
      ...mapGetters([
        'allowShortcuts'
      ])
    },

    watch: {
      busMessageProject (message) {
        if (!message) return
        switch (message.text) {
          case 'create':
            this.createProject()
            break
          case 'rename':
            this.renameProject(message.projectName)
            break
          case 'delete':
            this.deleteProject(message.projectName)
            break
          case 'save-all':
            this.saveProjects()
            break
          case 'add-file':
            if (!this.currentProject.name || !message.filePath) return
            this.addFile(message.filePath)
        }
      }
    },

    mounted () {
      this.sbMinWidth = 244
      this.sbMaxWidth = 600

      // Wrapper resize handler
      $('.pc-wrapper').resizable({
        handleSelector: '.pc-divider',
        resizeHeight: false,
        onDrag: throttle((e, $el, newWidth) => {
          if (newWidth > this.sbMaxWidth) newWidth = this.sbMaxWidth
          else if (newWidth < this.sbMinWidth) newWidth = this.sbMinWidth
          this.$store.commit('VIEW_SET_SIDEBAR_WIDTH', newWidth)
          return false
        }, 50)
      })

      // IPC handlers
      ipc.on('add-project-files', (event, files, action) => {
        files.forEach((file) => { this.$refs.ref_tree[action](file) })
      })

      // Shortcut handlers
      this.$Mousetrap.bindGlobal(['command+alt+t', 'ctrl+alt+t'], () => {
        if (this.allowShortcuts) this.$store.commit('VIEW_TOGGLE_SIDEBAR')
      })
      this.$Mousetrap.bindGlobal(['command+alt+n', 'ctrl+alt+n'], () => {
        if (this.allowShortcuts) this.createProject()
      })
      this.$Mousetrap.bindGlobal(['command+alt+o', 'ctrl+alt+o'], () => {
        if (this.allowShortcuts) this.$store.commit('VIEW_TOGGLE_DIALOG_PROJECTS')
      })
      this.$Mousetrap.bindGlobal(['command+alt+s', 'ctrl+alt+s'], () => {
        if (this.allowShortcuts) this.saveProjects()
      })
      this.$Mousetrap.bindGlobal(['command+alt+r', 'ctrl+alt+r'], () => {
        if (this.allowShortcuts) this.renameProject(this.currentProject.name)
      })
      this.$Mousetrap.bindGlobal(['command+alt+w', 'ctrl+alt+w'], () => {
        if (this.allowShortcuts) this.$store.commit('PROJECT_SET_CURRENT', null)
      })
      this.$Mousetrap.bindGlobal(['command+alt+=', 'ctrl+alt+='], () => {
        if (this.allowShortcuts) this.$store.commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'add-file', filePath: this.currentFile.path } })
      })
    },

    methods: {
      createProject () {
        this.$prompt('Project Name:', 'Creating a Project', {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel',
          inputValidator: name => this.$store.getters.getProjectByName(name) ? 'You already have a project with such name' : true
        }).then(result => {
          this.$store.dispatch('createProject', {
            projectName: result.value,
            setCurrent: true
          })
        }).catch(() => {})
      },
      renameProject (projectName) {
        if (!projectName) return
        this.$prompt('Project Name:', 'Renaming a Project', {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel',
          inputValue: projectName,
          inputValidator: name => name !== projectName && this.$store.getters.getProjectByName(name) ? 'You already have a project with such name' : true
        }).then(result => {
          this.$store.commit('PROJECT_SET_NAME', { projectName, newName: result.value })
        }).catch(() => {})
      },
      deleteProject (projectName) {
        this.$confirm(`Are you sure you want to delete project "${projectName}"?`, 'Deleting a Project', {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }).then(() => {
          this.$store.dispatch('deleteProject', { projectName })
        }).catch(() => {})
      },
      saveProjects () {
        this.$store.dispatch('saveProjects')
      },
      addFile (filePath) {
        this.$refs.ref_tree.addFile(filePath)
      }
    }
  }
</script>

<style>
  @import '../assets/styles/vars.css';

  .pc-wrapper {
    flex-shrink: 0;
    display: flex;
    min-width: var(--sb-min-width);
    width: var(--sb-min-width);
  }

  .pc-elements {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .pc-divider {
    width: 3px;
    flex-shrink: 0;
    border-left: 1px solid var(--border-color-2);
    border-right: 1px solid var(--border-color-2);
    background-color: var(--theme-color-1-l96);
    cursor: ew-resize;
  }

  .pc-title {
    text-align: center;
    font-family: var(--font-family-2);
    font-size: 16px;
    height: 39px;
    line-height: 39px;
    background: linear-gradient(to bottom, var(--theme-color-1-l98) 0%, var(--theme-color-1-l96) 100%);
    border-bottom: 1px solid var(--border-color-1);
    color: var(--theme-color-1-l40);
  }

  .pc-button {
    height: 39px;
    width: 100%;
    border-radius: 0;
  }
</style>
