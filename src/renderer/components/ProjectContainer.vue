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
  import throttle from 'lodash/throttle'
  import ProjectTree from './ProjectTree'

  // jquery-resizable-dom
  // eslint-disable-next-line
  $.fn.resizable = function t(d){var h={handleSelector:null,resizeWidth:!0,resizeHeight:!0,resizeWidthFrom:"right",resizeHeightFrom:"bottom",onDragStart:null,onDragEnd:null,onDrag:null,touchActionNone:!0,instanceId:null};return"object"==typeof d&&(h=$.extend(h,d)),this.each(function(){var i,e,r=$.extend({},h);r.instanceId||(r.instanceId="rsz_"+(new Date).getTime());var t,a=$(this);if("destroy"===d){if(!(r=a.data("resizable")))return;return(t=u(r.handleSelector,a)).off("mousedown."+r.instanceId+" touchstart."+r.instanceId),r.touchActionNone&&t.css("touch-action",""),void a.removeClass("resizable")}function n(t){t.stopPropagation(),t.preventDefault()}function o(t){var e,n,o=c(t);e="left"===r.resizeWidthFrom?i.width-o.x+i.x:i.width+o.x-i.x,n="top"===r.resizeHeightFrom?i.height-o.y+i.y:i.height+o.y-i.y,r.onDrag&&!1===r.onDrag(t,a,e,n,r)||(r.resizeHeight&&a.height(n),r.resizeWidth&&a.width(e))}function s(t){return t.stopPropagation(),t.preventDefault(),$(document).off("mousemove."+r.instanceId),$(document).off("mouseup."+r.instanceId),(window.Touch||navigator.maxTouchPoints)&&($(document).off("touchmove."+r.instanceId),$(document).off("touchend."+r.instanceId)),$(document).off("selectstart."+r.instanceId,n),a.css("transition",e),$("iframe").css("pointer-events","auto"),r.onDragEnd&&r.onDragEnd(t,a,r),!1}function c(t){var e={x:0,y:0,width:0,height:0};if("number"==typeof t.clientX)e.x=t.clientX,e.y=t.clientY;else{if(!t.originalEvent.touches)return null;e.x=t.originalEvent.touches[0].clientX,e.y=t.originalEvent.touches[0].clientY}return e}function u(t,e){return t&&">"===t.trim()[0]?(t=t.trim().replace(/^>\s*/,""),e.find(t)):t?e.parent().find(t):e}a.data("resizable",r),t=u(r.handleSelector,a),r.touchActionNone&&t.css("touch-action","none"),a.addClass("resizable"),t.on("mousedown."+r.instanceId+" touchstart."+r.instanceId,function(t){t.preventDefault&&t.preventDefault();if((i=c(t)).width=parseInt(a.width(),10),i.height=parseInt(a.height(),10),e=a.css("transition"),a.css("transition","none"),r.onDragStart&&!1===r.onDragStart(t,a,r))return;$(document).on("mousemove."+r.instanceId,o),$(document).on("mouseup."+r.instanceId,s),(window.Touch||navigator.maxTouchPoints)&&($(document).on("touchmove."+r.instanceId,o),$(document).on("touchend."+r.instanceId,s));$(document).on("selectstart."+r.instanceId,n),$("iframe").css("pointer-events","none")})})};

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
          case 'add-files':
            if (!this.currentProject.name) return
            this.addFiles(message)
            break
          case 'reload':
            this.$refs.ref_tree.loadTreeData()
        }
      }
    },

    mounted () {
      this.sbMinWidth = 242
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
        if (this.allowShortcuts) this.$store.commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'add-files', filePath: this.currentFile.path } })
      })
    },

    methods: {
      createProject () {
        this.$prompt('Project name:', 'Creating a Project', {
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
      addFiles ({ action, filePath }) {
        if (action) {
          setTimeout(() => { ipc.send('open-file-dialog', { target: 'pc', action }) })
        } else if (filePath) {
          this.$refs.ref_tree.addFile(filePath)
        }
      }
    }
  }
</script>

<style>
  @import '../assets/styles/vars.css';

  .pc-wrapper {
    flex-shrink: 0;
    position: relative;
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
    flex-shrink: 0;
    width: 4px;
    position: absolute;
    opacity: 0;
    right: 0;
    top: 0;
    bottom: 0;
    cursor: ew-resize;
  }

  .pc-title {
    text-align: center;
    font-family: var(--font-family-2);
    font-size: 16px;
    height: 39px;
    line-height: 39px;
    background: linear-gradient(to bottom, var(--theme-color-1-l98) 0%, var(--theme-color-1-l96) 100%);
    border-right: 1px solid var(--border-color-1);
    border-bottom: 1px solid var(--border-color-1);
    color: var(--theme-color-1-l40);
  }

  .pc-button {
    height: 39px;
    width: 100%;
    border-radius: 0;
  }
</style>
