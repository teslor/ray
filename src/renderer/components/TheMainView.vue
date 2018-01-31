<template>
  <div class="mv-wrapper">
    <main class="mv-main">
      <action-bar/>
      <div class="mv-elements">
        <project-container v-show="displaySidebar"/>
        <file-container/>
      </div>
    </main>
    <dialog-projects/>
    <dialog-settings/>
    <dialog-help/>
  </div>
</template>

<script>
  import { mapState, mapGetters } from 'vuex'
  import ActionBar from './ActionBar'
  import ProjectContainer from './ProjectContainer'
  import FileContainer from './FileContainer'
  import DialogProjects from './DialogProjects'
  import DialogSettings from './DialogSettings'
  import DialogHelp from './DialogHelp'

  export default {
    name: 'the-main-view',
    components: { ActionBar, ProjectContainer, FileContainer, DialogProjects, DialogSettings, DialogHelp },

    computed: {
      ...mapState({
        currentProject: state => state.currentProject,
        displaySidebar: state => state.view.sidebar.visible
      }),
      ...mapGetters([
        'allowShortcuts'
      ])
    },

    watch: {
      currentProject (newCurrentProject) {
        if (this.displaySidebar || !newCurrentProject.name) return
        this.$store.commit('VIEW_TOGGLE_SIDEBAR', true)
      }
    },

    mounted () {
      // Shortcut handlers
      this.$Mousetrap.bindGlobal(['f1'], () => {
        if (this.allowShortcuts) this.$store.commit('VIEW_TOGGLE_DIALOG_HELP')
      })
      this.$Mousetrap.bindGlobal(['f9'], () => {
        if (this.allowShortcuts) this.$store.commit('VIEW_TOGGLE_DIALOG_SETTINGS')
      })
    }
  }
</script>

<style>
  @import '../assets/styles/vars.css';

  .mv-wrapper {
    height: 100vh;
  }

  .mv-main {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .mv-elements {
    flex: 1;
    display: flex;
    border-top: 1px solid var(--border-color-1);
  }
</style>
