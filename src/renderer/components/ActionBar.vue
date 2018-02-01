<template>
  <div class="ab-wrapper">
    <div class="ab-group">
      <div class="ab-group-project">
        <el-button class="ab-button" :class="{ active: displaySidebar }" @click="toggleProjectBar"><i class="fas fa-bars"></i></el-button>
        <el-button class="ab-button" @click="createProject"><i class="fas fa-plus"></i></el-button>
        <el-button class="ab-button" @click="saveProjects"><i class="fas fa-download"></i></el-button>
        <el-button class="ab-button" @click="showProjectList"><i class="fas fa-ellipsis-v"></i></el-button>
      </div>

      <div class="ab-group-file">
        <el-dropdown
            :disabled="true"
            class="ab-dropdown"
            placement="bottom-start"
            trigger="click"
            :show-timeout="0"
            @click="openFile"
            @command="openFileByPath"
            split-button>
          <i class="far fa-folder-open"></i>

          <el-dropdown-menu slot="dropdown">
            <template v-if="recentFiles.length > 0">
              <el-dropdown-item v-for="file in recentFiles" :key="file.path" :command="file.path">{{ file.name }}</el-dropdown-item>
            </template>
            <el-dropdown-item v-else disabled>No Recent Files</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <el-dropdown
            v-show="currentFile.dataType"
            class="ab-dropdown"
            placement="bottom-start"
            trigger="click"
            :show-timeout="0"
            @click="saveFile"
            @command="saveFileAs"
            split-button>
          <i class="far fa-clone"></i>

          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item :disabled="!currentFile.path">Save File As</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <el-button class="ab-button" :disabled="!currentFile.path" @click="showFileInExplorer"><i class="fas fa-external-link-alt"></i></el-button>
        <el-button v-show="currentFile.dataType" class="ab-button" :class="{ active: currentFile.searchMode }" @click="toggleSearch"><i class="fas fa-search"></i></el-button>
      </div>
    </div>

    <div class="ab-group">
      <el-button class="ab-button" @click="showSettingsDialog"><i class="fas fa-cog"></i></el-button>
      <el-button class="ab-button" @click="showHelpDialog"><i class="fas fa-question"></i></el-button>
    </div>
  </div>
</template>

<script>
  import { ipcRenderer as ipc } from 'electron'
  import { mapState } from 'vuex'

  export default {
    name: 'action-bar',

    data () {
      return {
      }
    },

    computed: {
      ...mapState({
        currentProject: state => state.currentProject,
        currentFile: state => state.currentFile,
        displaySidebar: state => state.view.sidebar.visible,
        recentFiles: state => state.recentFiles
      })
    },

    methods: {
      toggleProjectBar () {
        this.$store.commit('VIEW_TOGGLE_SIDEBAR')
      },
      createProject () {
        this.$store.commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'create' } })
      },
      saveProjects () {
        this.$store.commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'save-all' } })
      },
      showProjectList () {
        this.$store.commit('VIEW_TOGGLE_DIALOG_PROJECTS', true)
      },
      openFile () {
        ipc.send('open-file-dialog')
      },
      openFileByPath (path) {
        this.$store.dispatch('openFile', {
          filePath: path,
          setCurrent: true
        })
      },
      saveFile () {
        if (this.currentFile.path) {
          this.$store.commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'save-current' } })
        } else {
          this.saveFileAs()
        }
      },
      saveFileAs () {
        ipc.send('save-file-dialog')
      },
      showFileInExplorer () {
        this.$store.commit('BUS_ADD_MESSAGE', { section: 'file', message: { text: 'show-in-folder' } })
      },
      toggleSearch () {
        this.$store.commit('FILE_SET_SEARCH_MODE', { fileId: this.currentFile.id })
      },
      showSettingsDialog () {
        this.$store.commit('VIEW_TOGGLE_DIALOG_SETTINGS', true)
      },
      showHelpDialog () {
        this.$store.commit('VIEW_TOGGLE_DIALOG_HELP', true)
      }
    }
  }
</script>

<style>
  @import '../assets/styles/vars.css';

  .ab-wrapper {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    padding: 4px;
    background-color: var(--theme-color-1-l96);
    border-top: 1px solid var(--border-color-2);
  }

  .ab-group {
    display: flex;

    & .el-button {
      padding: 0;
      width: 41px;
      height: 30px;
      background-color: var(--theme-color-1-l90);
      border-color: var(--border-color-1);
      color: #888;
    }

    & .el-button:hover {
      background-color: var(--theme-color-1-l94);
      color: #555;
    }

    & .el-button:focus {
      background-color: #ceeefd;
    }

    & .active {
      background-color: #f9f7db !important;
    }
  }

  .ab-group-project {
    display: flex;
    margin-right: 16px;
  }

  .ab-group-file {
    display: flex;
    margin-right: 8px;
  }

  .ab-dropdown {
    & .el-button-group {
      display: flex;
    }

    & .el-dropdown__caret-button {
      width: 30px;
    }
  }

  .ab-dropdown + .ab-dropdown, .ab-dropdown + .ab-button, .ab-button + .ab-button {
    margin-left: 2px;
  }
</style>