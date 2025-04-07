<template>
  <div class="project-files">
    <div v-show="project.name && isToolbarVisible" class="project-toolbar">
      <el-button-group size="small">
        <el-button class="bar-button" @click="addRootFolder">
          <icon-folder :size="iconSize" :stroke="iconStroke" />
        </el-button>
        <el-button class="bar-button" :disabled="!currentNode || currentNodeType === 'file'" @click="addFolder(false)">
          <icon-folder-plus :size="iconSize" :stroke="iconStroke" />
        </el-button>
        <el-button class="bar-button" :disabled="!currentNode || currentNodeType === 'file'" @click="renameFolder(null)">
          <icon-folder-question :size="iconSize" :stroke="iconStroke" />
        </el-button>
        <el-button class="bar-button" @click="requestAddRootFile">
          <icon-file :size="iconSize" :stroke="iconStroke" />
        </el-button>
        <el-button class="bar-button" :disabled="!currentNode || currentNodeType === 'file'" @click="requestAddFile">
          <icon-file-plus :size="iconSize" :stroke="iconStroke" />
        </el-button>
        <el-button class="bar-button" :disabled="!currentNode" @click="removeItem">
          <icon-trash :size="iconSize" :stroke="iconStroke" />
        </el-button>
      </el-button-group>
    </div>
    <div class="project-tree" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted  } from 'vue'
import { useStore } from 'vuex'
import { useDebounceFn } from '@vueuse/core'
import $ from 'jquery'
import 'jstree'
import IconFolder from '@tabler-icons/IconFolder.mjs'
import IconFolderPlus from '@tabler-icons/IconFolderPlus.mjs'
import IconFolderQuestion from '@tabler-icons/IconFolderQuestion.mjs'
import IconFile from '@tabler-icons/IconFile.mjs'
import IconFilePlus from '@tabler-icons/IconFilePlus.mjs'
import IconTrash from '@tabler-icons/IconTrash.mjs'
const { state, commit, dispatch } = useStore()
const { updateAppState, getFileNameFromPath, openFileDialog, handleAddProjectFiles } = window.electronAPI

const props = defineProps({
  project: { type: Object, required: true },
})

let treeInstance = null
const currentNode = ref(null)
const currentNodeType = ref('')
let isLoadingTreeData = false
const iconSize = 18
const iconStroke = 2

const isToolbarVisible = computed(() => state.view.projectToolbar.visible)
const busMessageProject = computed(() => state.bus.project)
const currentFile = computed(() => state.currentFile)

watch(() => props.project, () => {
  loadTreeData()
})
watch(busMessageProject, (message) => {
  switch (message.text) {
    case 'add-files':
      if (!props.project.name) return
      if (message.action) openFileDialog({ target: 'pc', action: message.action })
      else if (message.filePath) addFile(message.filePath)
      break
    case 'reload':
      loadTreeData()
  }
})
watch(() => currentFile.value.path, (filePath) => { // triggered when a file opened/selected
  // Update app state
  if (filePath) updateAppState({ key: 'currentFileDir', value: filePath })

  // Update tree node selection
  if (!treeInstance) return
  const selectedNode = treeInstance.get_selected(true)[0]
  if (selectedNode?.data?.path === filePath) return // a file from the viewer is selected -> do nothing
  const allNodes = treeInstance.get_json(null, { no_state: true, no_li_attr: true, no_a_attr: true, flat: true })
  const nodeToSelect = allNodes.find(node => node.data.path === filePath)
  if (selectedNode) setTimeout(() => treeInstance.deselect_node(selectedNode.id), 0)
  if (nodeToSelect) setTimeout(() => treeInstance.select_node(nodeToSelect.id), 0)
})

onMounted(() => {
  treeInstance = $('.project-tree')
    .on('changed.jstree', (e, data) => { // triggered when selection changes
      if (data.action !== 'select_node') return
      currentNode.value = data.selected[0]
      const nodeInfo = treeInstance.get_node(data.selected[0])
      currentNodeType.value = nodeInfo.type
      if (!isLoadingTreeData && nodeInfo.type === 'file' && nodeInfo.data?.path) {
        dispatch('addActiveFile', { filePath: nodeInfo.data.path, setCurrent: true })
      }
    })
    .on('move_node.jstree after_open.jstree after_close.jstree', updateProjectData)
    .jstree({
      core: {
        multiple: false,
        check_callback: true
      },
      types: {
        default: { icon: 'ray-icon-folder' },
        file: { icon: 'ray-icon-file' }
      },
      plugins: ['types', 'dnd', 'wholerow', 'sort'],
      sort: function (a, b) {
        const aNode = this.get_node(a)
        const bNode = this.get_node(b)
        if (aNode.type === 'file' && bNode.type !== 'file') return 1
        else if (aNode.type !== 'file' && bNode.type === 'file') return -1
        else return aNode.text > bNode.text ? 1 : -1
      }
    })
    .jstree(true)
  if (props.project) loadTreeData()
})

onUnmounted(() => {
  treeInstance.destroy()
})

// IPC handlers
handleAddProjectFiles((event, files, action) => {
  files.forEach((file) => {
    if (action === 'addFile') addFile(file)
    else addRootFile(file)
  })
})

const updateProjectData = useDebounceFn((event) => {
  commit('PROJECT_SET_DATA', { projectName: props.project.name, data: getTreeData() })
  if (!event) dispatch('saveProjects') // save to config when an item added/removed/renamed
}, 1000)

function requestAddRootFile() {
  commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'add-files', action: 'addRootFile' } })
}

function requestAddFile() {
  commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'add-files', action: 'addFile' } })
}

function addRootFolder() {
  addFolder(true)
}

function addFolder(isRoot = false) {
  const parent = isRoot ? null : currentNode.value
  const newNode = treeInstance.create_node(parent, { text: 'New Folder' })
  if (newNode) renameFolder(newNode)
}

function renameFolder(node) {
  const folder = node || currentNode.value
  const oldName = treeInstance.get_node(folder).text
  if (folder) treeInstance.edit(folder, null, (node) => { if (node.text !== oldName) updateProjectData() })
}

function addRootFile(filePath) {
  addFile(filePath, true)
}

async function addFile(filePath, isRoot = false) {
  const parent = isRoot ? null : (!currentNode.value || currentNodeType.value === 'file' ? null : currentNode.value)
  treeInstance.create_node(parent, { type: 'file', text: await getFileNameFromPath(filePath), data: { path: filePath } })
  if (!isRoot) treeInstance.open_node(parent)
  await nextTick()
  updateProjectData()
}

async function removeItem() {
  if (!currentNode.value) return
  treeInstance.delete_node(currentNode.value)
  await nextTick()
  updateProjectData()
}

function getTreeData() {
  const data = treeInstance.get_json(null, {
    no_id: true, no_li_attr: true, no_a_attr: true
  })
  if (!data.length) return null
  cleanData(data)
  return data
}

function loadTreeData() {
  isLoadingTreeData = true
  treeInstance.settings.core.data = props.project.data
  treeInstance.refresh(true)
  setTimeout(() => { isLoadingTreeData = false }, 100) // prevent activating/opening selected file when reloading
}

function cleanData(data) {
  for (let i = 0; i < data.length; i += 1) {
    delete data[i].id
    delete data[i].icon
    if (data[i].type === 'default') {
      delete data[i].data
      delete data[i].type
    }
    if (data[i].state) {
      if (data[i].state.opened) {
        delete data[i].state.loaded
        delete data[i].state.selected
        delete data[i].state.disabled
      } else {
        delete data[i].state
      }
    }
    if (data[i].children && data[i].children.length) cleanData(data[i].children)
    else delete data[i].children
  }
}
</script>

<style scoped>
.project-files {
  height: calc(100% - var(--bar-height));
  display: flex;
  flex-direction: column;
  width: 100%;
}

.project-toolbar {
  min-width: var(--sidebar-min-width);
  background-color: var(--ui-bg-color-secondary);
  padding: var(--toolbar-padding);
  border-right: 1px solid var(--ui-border-color);
  border-bottom: 1px solid var(--ui-border-color);
}

.bar-button {
  padding: 0;
  width: 40px;
}

.project-tree {
  flex: 1;
  overflow: auto;
  background: var(--tree-bg);
  font-size: 15px;
  border-right: 1px solid var(--ui-border-color);
}
</style>

<style>
.project-tree.jstree {
  .jstree-rename-input {
    outline: none;
  }

  .jstree-node .jstree-node {
    margin-left: 12px;
  }

  .jstree-wholerow-hovered {
    background: var(--ui-bg-color-primary);
  }

  .jstree-wholerow-clicked {
    background: var(--ui-color-secondary);
  }

  li:not(.jstree-leaf) {
    color: var(--folder-text-color);
    font-weight: 500;
  }

  li.jstree-leaf {
    color: var(--file-text-color);
    font-weight: normal;
  }
}
</style>
