<template>
  <el-dialog
    v-model="showDialog"
    class="dialog-help"
    title="Help"
    width="80%"
    align-center
    @close="handleDialogClose"
  >
    <el-tabs tab-position="left">
      <el-tab-pane label="Guide" class="guide-section">
        <h2>Overview</h2>
        <p>Ray is a minimalist WYSIWYG* text editor. It's designed for creating and organising personal notes.</p>
        <p>The main features include:</p>
        <ul>
          <li>Use of HTML format. This means advanced styling options and the ability to open created files in any application that supports HTML (e.g. browsers).</li>
          <li>Ability to organise files using projects (see below).</li>
          <li>Local files encryption</li>
          <li>Styles customization of the editor and created files.</li>
          <li>Support of color themes</li>
        </ul>
        <p>* - What You See Is What You Get</p>

        <h2>Files</h2>
        <p>You can create, open and save files in HTML format. All open files are displayed in tabs (as in browsers).</p>
        <p>It's also possible to open HTML files created in other applications. In this case, the files are opened in read-only mode.</p>
        <p>In Search Mode, you can find/replace text in a file (<strong>the file is not editable when Search Mode is active</strong>).</p>
        <p><strong>Note: </strong>If you get an error when opening/saving a file, make sure you have read/write permissions to the directory.</p>
        <p class="tips-caption">Tips:</p>
        <ul>
          <li>Ray keeps track of the five most recently closed files for quick access.</li>
          <li>When you rename a file using the app, the file paths/names in all your projects are automatically updated.</li>
          <li>Copy file content from another program to the clipboard and paste it into the editor as HTML.</li>
          <li>Insert images, video links and hyperlinks into file content. Hyperlinks open in your default browser.</li>
        </ul>

        <h2>Projects</h2>
        <p>Project is a way of organising files into knowledge base so that you can quickly access files related to a common theme.</p>
        <p>
          A project is represented by a tree of folders and files, just like in a file manager app.
          However, <strong>project folders are virtual and not related to real directories in your file system</strong>.
          So you can easily rearrange project structure and include files from different locations (or different projects can include the same file). You can also quickly switch between all your projects.
        </p>
        <p>Projects are automatically saved before you exit the application, or you can manually save all changes using the appropriate button/shortcut.</p>
        <p class="tips-caption">Tips:</p>
        <ul>
          <li>You can drag and drop folders/files within the project tree view.</li>
          <li>It may be useful to create a single root folder for your project on your hard drive and keep all related files there, but create the entire folder structure within the app.</li>
          <li>The structure for all projects is stored in the application configuration file (see below).</li>
        </ul>

        <h2>Configuration file</h2>
        <p>All settings are stored in the configuration file <b>config.json</b> located in the app directory.</p>
        <p>You can view it in a file manager by clicking on the button in the Settings dialog.</p>
        <p>It's highly recommended to back up this file from time to time.</p>
      </el-tab-pane>

      <el-tab-pane label="Tips" class="guide-section">
        <h2>Adjusting font size</h2>
        <p>There are two options here:</p>
        <ul>
          <li>Scale the whole interface. Use it if it's ok if all app elements will become less or bigger in size.</li>
          <li>Set editor font size in Settings if you just need to adjust the editor font size.</li>
        </ul>
        <p>You can combine both.</p>

        <h2>Adding an image</h2>
        <p>An image can be added it two ways:</p>
        <ul>
          <li>
            Use Hyperlink button (or shortcut) to add a hyperlink, then enter an image web url.
            The image url should have appropriate file extension, otherwise it will be treated as usual hyperlink.
          </li>
          <li>
            Use Picture button to select a local image file. An image will be embedded in HTML file using Base64 encoding.
          </li>
        </ul>

        <h2>File encryption</h2>
        <p>
          Ray allows to encrypt HTML files using strong AES 256 GCM cipher.
          It's highly recommended for files that contain high sensitive/private data. Encrypted files are saved with .htmr extension.
          They are also compressed, so take up less disk space than plain HTML files.
        </p>
        <p>
          To encrypt a file you need to make up a secret phrase (SP) that will be used to encrypt/decrypt this file.
          Strong SP should be at least 10-12 characters and preferably include special characters. It's better if it's some memorable phrase.
          It may be good option to use single SP for all encrypted files so you won't need to remember/enter various SPs for different files.
          If you turn on "Use single secret phrase" setting, the latest SP you entered is used to encrypt/decrypt files.
          Remember that if you lost/forget your SP for some file it would be impossible to open/see it!
        </p>
        <p>
          If you accidentally encrypted an open file and can't remember SP you entered, save the file as decrypted and encrypt it again.
          But once you close a file, you will need its SP to open it again.
          When a file is saved as encrypted, the corresponding unencrypted file is removed from disk and vice versa.
        </p>

        <h2>Color themes</h2>
        <p>
          You can change the colors of the interface elements by changing color themes.
          There are two color themes that are already set up: light (called "Ray") and dark ("Space").
        </p>
        <p>
          Themes are just plain CSS files located in the /Themes folder (in the app user folder), so you can modify existing themes or create new ones.
          The /Themes folder is scanned when the app starts and all the themes that are found become available for selection in Settings.
        </p>

        <h2>File printing</h2>
        <p>
          The app doesn't have dedicated print function, but since all Ray files are plain HTML files,
          you can just open a file in your favorite browser and print the file from there (printer, pdf, etc.).
        </p>
      </el-tab-pane>

      <el-tab-pane label="Shortcuts" class="shortcuts-section">
        <template v-for="sc in shortcuts" :key="sc.section">
          <h2>{{ sc.section }}</h2>
          <div class="shortcut-list">
            <div v-for="item in sc.items" :key="item.keys[0]" class="row">
              <div class="col1">
                <el-tag v-for="key in item.keys" :key="key" class="shortcut" type="success" size="large">{{ key }}</el-tag>
              </div>
              <div class="col2">{{ item.text }}</div>
              <component :is="item.icon" v-if="item.icon" :size="18" :stroke="1.5" class="col3" />
            </div>
          </div>
        </template>
      </el-tab-pane>

      <el-tab-pane label="About" class="about-section">
        <h2>Ray 1.0.0</h2>
        <p><a class="ray-link" href="" @click.prevent="openUrl('https://github.com/teslor/ray')">https://github.com/teslor/ray</a></p>
        <p>Released under the MIT license.</p>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import IconMenu2 from '@tabler-icons/IconMenu2.mjs'
import IconSquarePlus from '@tabler-icons/IconSquarePlus.mjs'
import IconLayoutList from '@tabler-icons/IconLayoutList.mjs'
import IconPencil from '@tabler-icons/IconPencil.mjs'
import IconFileArrowLeft from '@tabler-icons/IconFileArrowLeft.mjs'
import IconFolderShare from '@tabler-icons/IconFolderShare.mjs'
import IconFolder from '@tabler-icons/IconFolder.mjs'
import IconFileDownload from '@tabler-icons/IconFileDownload.mjs'
import IconFilePencil from '@tabler-icons/IconFilePencil.mjs'
import IconSearch from '@tabler-icons/IconSearch.mjs'
import IconSettings from '@tabler-icons/IconSettings.mjs'
import IconHelpOctagon from '@tabler-icons/IconHelpOctagon.mjs'
import IconBold from '@tabler-icons/IconBold.mjs'
import IconItalic from '@tabler-icons/IconItalic.mjs'
import IconUnderline from '@tabler-icons/IconUnderline.mjs'
import IconStrikethrough from '@tabler-icons/IconStrikethrough.mjs'
import IconSuperscript from '@tabler-icons/IconSuperscript.mjs'
import IconSubscript from '@tabler-icons/IconSubscript.mjs'
import IconQuote from '@tabler-icons/IconQuote.mjs'
import IconCode from '@tabler-icons/IconCode.mjs'
import IconSourceCode from '@tabler-icons/IconSourceCode.mjs'
import IconAlignLeft from '@tabler-icons/IconAlignLeft.mjs'
import IconAlignCenter from '@tabler-icons/IconAlignCenter.mjs'
import IconAlignRight from '@tabler-icons/IconAlignRight.mjs'
import IconAlignJustified from '@tabler-icons/IconAlignJustified.mjs'
import IconList from '@tabler-icons/IconList.mjs'
import IconListNumbers from '@tabler-icons/IconListNumbers.mjs'
import IconListCheck from '@tabler-icons/IconListCheck.mjs'
import IconIndentIncrease from '@tabler-icons/IconIndentIncrease.mjs'
import IconIndentDecrease from '@tabler-icons/IconIndentDecrease.mjs'
import IconLink from '@tabler-icons/IconLink.mjs'
import IconClearFormatting from '@tabler-icons/IconClearFormatting.mjs'
import IconArrowBackUp from '@tabler-icons/IconArrowBackUp.mjs'
import IconArrowForwardUp from '@tabler-icons/IconArrowForwardUp.mjs'
const { state, commit } = useStore()
const { isMac, openUrl } = window.electronAPI

const showDialog = ref(false)

const modKey = isMac() ? '⌘' : 'Ctrl'
const altKey = isMac() ? 'Option' : 'Alt'
const shortcuts = [
  {
    section: 'Application',
    items: [
      { keys: ['F1'], text: 'Show Help', icon: IconHelpOctagon },
      { keys: ['F9'], text: 'Show Settings', icon: IconSettings },
      { keys: isMac() ? [`Ctrl + ${modKey} + F`] : ['F11'], text: 'Toggle Fullscreen Mode' },
      { keys: ['F12'], text: 'Show/Hide All Toolbars' },
      { keys: ['Esc'], text: 'Close Dialog, Exit Search Mode' },
      { keys: [`${modKey} + (=)`, `${modKey} + (-)`], text: 'Zoom In/Out by 5%' },
      { keys: [`${modKey} + 0`], text: 'Reset Zoom' },
    ]
  },
  {
    section: 'Projects',
    items: [
      { keys: [`${modKey} + ${altKey} + T`], text: 'Toggle Project Sidebar', icon: IconMenu2 },
      { keys: [`${modKey} + ${altKey} + N`], text: 'Create Project', icon: IconSquarePlus },
      { keys: [`${modKey} + ${altKey} + O`], text: 'Show Project List', icon: IconLayoutList },
      { keys: [`${modKey} + ${altKey} + R`], text: 'Rename Project', icon: IconPencil },
      { keys: [`${modKey} + ${altKey} + W`], text: 'Close Project' },
      { keys: [`${modKey} + ${altKey} + =`], text: 'Add File to Current Project', icon: IconFileArrowLeft }
    ]
  },
  {
    section: 'Files',
    items: [
      { keys: [`${modKey} + N`], text: 'Create File (Add New Tab)' },
      { keys: [`${modKey} + O`], text: 'Open File(s)', icon: IconFolder },
      { keys: [`${modKey} + S`], text: 'Save File / Save File As', icon: IconFileDownload },
      { keys: [`${modKey} + ${altKey} + Shift + S`], text: 'Save All Files (that have changes)' },
      { keys: [`${modKey} + R`], text: 'Rename File', icon: IconFilePencil },
      { keys: [`${modKey} + W`], text: 'Close File' },
      { keys: [`${modKey} + F`], text: 'Find Text in File', icon: IconSearch },
      { keys: [`${modKey} + ${altKey} + E`], text: 'Show File in File Manager', icon: IconFolderShare }
    ]
  },
  {
    section: 'Editor',
    items: [
      { keys: [`${modKey} + ${altKey} + 1..5`], text: 'Set Header Level 1..5' },
      { keys: [`${modKey} + B`], text: 'Bold Text', icon: IconBold },
      { keys: [`${modKey} + I`], text: 'Italic Text', icon: IconItalic },
      { keys: [`${modKey} + U`], text: 'Underlined Text', icon: IconUnderline },
      { keys: [`${modKey} + Shift + X`], text: 'Strikethrough Text', icon: IconStrikethrough },
      { keys: [`${modKey} + .`], text: 'Superscript', icon: IconSuperscript},
      { keys: [`${modKey} + ,`], text: 'Subscript', icon: IconSubscript },
      { keys: [`${modKey} + Shift + B`], text: 'Quote', icon: IconQuote },
      { keys: [`${modKey} + E`], text: 'Code', icon: IconCode },
      { keys: [`${modKey} + ${altKey} + C`], text: 'Code Block', icon: IconSourceCode },
      { keys: [`${modKey} + Shift + L`], text: 'Align Left', icon: IconAlignLeft },
      { keys: [`${modKey} + Shift + E`], text: 'Align Center', icon: IconAlignCenter },
      { keys: [`${modKey} + Shift + R`], text: 'Align Right', icon: IconAlignRight },
      { keys: [`${modKey} + Shift + J`], text: 'Align Justify', icon: IconAlignJustified },
      { keys: [`${modKey} + Shift + 7`], text: 'Numbered List', icon: IconListNumbers },
      { keys: [`${modKey} + Shift + 8`], text: 'Bulleted List', icon: IconList },
      { keys: [`${modKey} + Shift + 9`], text: 'Checkist', icon: IconListCheck },
      { keys: [`${modKey} + ]`, 'Tab'], text: 'Sink List Item', icon: IconIndentIncrease },
      { keys: [`${modKey} + [`, 'Shift + Tab'], text: 'Lift List Item', icon: IconIndentDecrease },
      { keys: [`${modKey} + K`], text: 'Set Hyperlink', icon: IconLink },
      { keys: [`${modKey} + Space`], text: 'Clear Formatting', icon: IconClearFormatting },
      { keys: [`${modKey} + Z`], text: 'Undo', icon: IconArrowBackUp },
      { keys: [`${modKey} + Shift + Z`, `${modKey} + Y`], text: 'Redo', icon: IconArrowForwardUp },
      { keys: [`${ isMac() ? `${altKey} +` : '' }${modKey} + Shift + V`], text: 'Paste Without Formatting' },
      { keys: [`${modKey} + /`], text: 'Change Case: UPPERCASE' },
      { keys: [`${modKey} + Shift + /`], text: 'Change Case: lowercase' },
      { keys: [`${modKey} + \\`], text: 'Change Case: Sentence case' },
      { keys: [`${modKey} + Shift + \\`], text: 'Change Case: Title Case' },
    ]
  }
]

const isDialogVisible = computed(() => state.view.dialogHelp.visible)

watch(isDialogVisible, (visible) => {
  showDialog.value = visible
})
watch(showDialog, (show) => {
  commit('VIEW_TOGGLE_DIALOG_HELP', show)
})

function handleDialogClose() {
  commit('BUS_ADD_MESSAGE', { section: 'editor', message: { text: 'focus' } })
}
</script>

<style scoped>
p, ul, h2 {
  margin: 0;
  padding: 0;
}

.el-tabs {
  width: 100%
}

.el-tab-pane {
  height: 100%;
  overflow: auto;
  font-size: 16px;
  line-height: 1.8;
  padding-right: 10px;

  h2 {
    font-size: 17px;
    font-weight: 500;
    padding: 10px 20px;
    background-color: var(--ui-bg-color-primary);
  }

  li {
    margin-left: 50px;
  }

  p + h2, ul + h2 {
    margin-top: 20px;
  }
}

.guide-section, .about-section {
  h2 {
    margin-bottom: 10px;
  }

  p + p {
    margin-top: 8px;
  }
}

.tips-caption {
  font-weight: bold;
  color: var(--ui-color-accent);
}

.shortcut-list {
  padding: 5px 0;
  background-color: var(--ui-bg-color-secondary);

  .row {
    padding: 5px 20px;
    display: flex;
    background-color: var(--ui-bg-color-secondary);
  }

  .col1 {
    min-width: 30%;
  }

  .col2 {
    flex: 1;
  }

  .col3 {
    color: var(--element-text-color-regular);
    width: 25%;
  }

  .shortcut {
    font-size: 14px;
    margin-right: 0.5em;
  }
}

.ray-link {
  color: var(--ui-color-accent);
  font-size: 17px;
  font-weight: 500;
  margin-bottom: 1.5em;
}
</style>

<style>
.dialog-help {
  max-width: 1200px;
  user-select: text;

  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    height: 88vh;
    display: flex;
  }

  .el-tabs__content {
    height: 100%;
  }

  .el-tabs__item {
    font-size: 17px;
  }
}
</style>
