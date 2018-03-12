<template>
  <el-dialog
      class="dh-dialog"
      title="Help"
      :visible="displayDialog"
      :before-close="hideDialog"
      top="6vh"
      width="90%">
    <el-tabs tab-position="left">
      <el-tab-pane label="Guide" class="dh-guide">
        <h2>Overview</h2>
        <p>Ray is nice and minimalist WYSIWYG* text editor. It's intended to create and organize personal notes.</p>
        <p>The key features are:</p>
        <ul>
          <li>Using HTML format. This means advanced styling options and ability to open created files in any programs that support HTML (e.g. browsers).</li>
          <li>File organizing capabilities by using projects (see below).</li>
          <li>Neat interface helps to do things more effectively.</li>
          <li>Adjusting styles of the editor and created files.</li>
        </ul>
        <p>* - What You See Is What You Get</p>

        <h2>Files</h2>
        <p>You can create, open and save files in HTML format. All opened files are shown in the tabs (like in browsers).</p>
        <p>It's also possible to open HTML files created in other programs. In this case files are opened in readonly mode.</p>
        <p>In Search Mode you can find/replace text in a file (the file is not editable when this mode is active).</p>
        <p><strong>Note: </strong>If you get an error during opening/saving a file, make sure you have read/write permissions in corresponding location.</p>
        <p class="dh-tips">Tips:</p>
        <ul>
          <li>Ray keeps the latest five files that were recently closed to provide quick access to them.</li>
          <li>When you rename a file by using the app the file paths/names in all your projects are updated automatically.</li>
          <li>You can copy file contents from another program to the buffer and paste in the editor as HTML.</li>
          <li>You can insert images, video links and hyperlinks in file contents. Hyperlinks are opened in your default browser.</li>
          <li>It's possible to open multiple files at once.</li>
          <li>When creating hyperlinks you can also refer to other local HTML files by using file:/// protocol.</li>
        </ul>

        <h2>Projects</h2>
        <p>Project is a way of file organizing to have quick access to files connected together by common subject.<p>
        <p>A project is represented by treelike structure of folders and files, exactly the same as you see in file manager.
          However project folders are virtual and not related to real folders in the file system.
          So you can easily rearrange project structure and include files from different locations (or different projects can include the same file). And also quickly switch between all your projects.</p>
        <p>Projects are saved automatically before quitting the app or you can save all changes manually by using appropriate button/shortcut.</p>
        <p class="dh-tips">Tips:</p>
        <ul>
          <li>You can drag and drop folders/files inside project tree view.</li>
          <li>The useful approach could be to create only one root folder for your project on your hard drive and keep all related files in it, but all folder structure - to create inside the app.</li>
          <li>Structure for all projects is saved in the application configuration file (see below).</li>
        </ul>

        <h2>Settings</h2>
        <p>In the Settings dialog you can set some options related to the editor, files etc.</p>
        <p><strong>New adjustable parameters are constantly added!</strong></p>

        <h2>Configuration File</h2>
        <p>All program settings are saved in the configuration file config.json located in the application folder.</p>
        <p>You can see it in Explorer/Finder by clicking the button in the Settings dialog.</p>
        <p>It's highly recommended to backup this file from time to time (especially if you have many projects).</p>
      </el-tab-pane>

      <el-tab-pane label="Shortcuts" class="dh-shortcuts">
        <template v-for="sc in shortcuts">
          <h2>{{ sc.section }}</h2>
          <div class="dh-sc-section">
            <div class="dh-sc-row" v-for="item in sc.items">
              <div class="col1"><el-tag type="success">{{ item.keys }}</el-tag></div>
              <div class="col2">{{ item.text }}</div>
              <div class="col3" v-if="item.icon"><i :class="item.icon"></i></div>
            </div>
          </div>
        </template>
      </el-tab-pane>

      <el-tab-pane label="About" class="dh-about">
        <h2>Ray 0.3.0</h2>
        <p>Project Link:</p>
        <p><a class="dh-link" href="" @click.prevent="openLink('https://github.com/teslor/ray')">
          https://github.com/teslor/ray
        </a></p>
        <p style="margin-top:15px">Releases:</p>
        <p><a class="dh-link" href="" @click.prevent="openLink('https://github.com/teslor/ray/releases')">
          https://github.com/teslor/ray/releases
        </a></p>
        <br>
        <p>Thank you for using Ray!</p>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script>
  import { mapState } from 'vuex'

  export default {
    name: 'dialog-help',

    computed: {
      ...mapState({
        displayDialog: state => state.view.dialogHelp.visible
      })
    },

    created () {
      this.shortcuts = [
        {
          section: 'Application',
          items: [
            { keys: 'F1', text: 'Show Help', icon: 'fas fa-question fa-sm' },
            { keys: 'F9', text: 'Show Settings', icon: 'fas fa-cog fa-sm' },
            { keys: process.platform === 'darwin' ? 'Ctrl + Cmd + F' : 'F11', text: 'Toggle Fullscreen Mode' },
            { keys: 'Esc', text: 'Close Dialog' }
          ]
        },
        {
          section: 'Projects',
          items: [
            { keys: 'Ctrl + Alt + T', text: 'Toggle Project Sidebar', icon: 'fas fa-bars fa-sm' },
            { keys: 'Ctrl + Alt + N', text: 'Create Project', icon: 'fas fa-plus fa-sm' },
            { keys: 'Ctrl + Alt + O', text: 'Show Project List', icon: 'fas fa-ellipsis-v fa-sm' },
            { keys: 'Ctrl + Alt + S', text: 'Save Projects', icon: 'fas fa-download' },
            { keys: 'Ctrl + Alt + R', text: 'Rename Current Project', icon: 'far fa-edit' },
            { keys: 'Ctrl + Alt + W', text: 'Close Current Project' },
            { keys: 'Ctrl + Alt + =', text: 'Add Active File to Current Project', icon: 'fas fa-angle-double-left' }
          ]
        },
        {
          section: 'Files',
          items: [
            { keys: 'Ctrl + N', text: 'Create File (Add New Tab)', icon: 'fas fa-plus fa-sm' },
            { keys: 'Ctrl + O', text: 'Open File(s)', icon: 'far fa-folder-open fa-sm' },
            { keys: 'Ctrl + S', text: 'Save File / Save File As', icon: 'far fa-clone fa-sm' },
            { keys: 'Ctrl + Alt + Shift + S', text: 'Save All Files (that have changes)' },
            { keys: 'Ctrl + R', text: 'Rename File' },
            { keys: 'Ctrl + W', text: 'Close File' },
            { keys: 'Ctrl + F', text: 'Find Text in File', icon: 'fas fa-search fa-sm' },
            { keys: 'Ctrl + Shift + E', text: 'Show File in Explorer/Finder', icon: 'fas fa-external-link-alt' }
          ]
        },
        {
          section: 'Editor',
          items: [
            { keys: 'Ctrl + 1..5', text: 'Set Header Level 1..5' },
            { keys: 'Ctrl + 7', text: 'Change Case: UPPERCASE' },
            { keys: 'Ctrl + Shift + 7', text: 'Change Case: lowercase' },
            { keys: 'Ctrl + 8', text: 'Change Case: Sentence case' },
            { keys: 'Ctrl + Shift + 8', text: 'Change Case: Title Case' },
            { keys: 'Ctrl + A', text: 'Select All' },
            { keys: 'Ctrl + B', text: 'Bold Text' },
            { keys: 'Ctrl + I', text: 'Italic Text' },
            { keys: 'Ctrl + U', text: 'Underlined Text' },
            { keys: 'Ctrl + K', text: 'Set Hyperlink' },
            { keys: 'Ctrl + E', text: 'Remove Format' },
            { keys: 'Ctrl + Z', text: 'Undo' },
            { keys: 'Ctrl + Shift + Z', text: 'Redo' }
          ]
        }
      ]
    },

    methods: {
      hideDialog () {
        this.$store.commit('VIEW_TOGGLE_DIALOG_HELP', false)
      },
      openLink (link) {
        this.$electron.shell.openExternal(link)
      }
    }
  }
</script>

<style>
  @import '../assets/styles/vars.css';

  .dh-dialog {
    & .el-dialog {
      height: 88vh;
      display: flex;
      flex-direction: column;
      margin-bottom: 0;
      max-width: 1200px;
    }

    & .el-dialog__header {
      display: none;
    }

    & .el-dialog__body {
      flex: 1;
      display: flex;
    }

    & .el-tabs {
      width: 100%
    }

    & .el-tabs__content {
      height: 100%;
    }

    & .el-tab-pane {
      height: 100%;
      overflow: auto;
      font-size: 16px;
      line-height: 1.8;
      padding-right: 10px;

      & h2 {
        font-size: 18px;
        font-weight: 500;
        padding: 10px 20px;
        background-color: var(--theme-color-1-l96);
      }

      & li {
        margin-left: 50px;
      }

      & p + h2, & ul + h2 {
        margin-top: 20px;
      }
    }

    & .el-tab-pane.dh-about {
      font-size: 17px;
      font-weight: 500;
    }

    & .el-tabs__item {
      font-size: 18px;
    }
  }

  .dh-guide, .dh-about {
    & h2 {
      margin-bottom: 10px;
    }
  }

  .dh-tips {
    font-weight: bold;
    color: var(--theme-color-2);
  }

  .dh-sc-section {
    padding: 5px 0;
    background-color: var(--bg-color-1);
  }

  .dh-sc-row {
    padding: 5px 20px;
    display: flex;
    background-color: var(--bg-color-1);

    & .el-tag {
      font-size: 14px;
    }

    & .col1 {
      min-width: 30%;
    }

    & .col2 {
      flex: 1;
    }

    & .col3 {
      color: #777;
      width: 25%;
    }
  }

  .dh-link {
    color: var(--theme-color-2)
  }
</style>