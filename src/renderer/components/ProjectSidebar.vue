<template>
  <div ref="sidebar" class="project-sidebar">
    <div v-if="currentProject.name" class="title">{{ currentProject.name }}</div>
    <el-button v-else class="create-button" type="primary" plain @click="createProject">Create a Project</el-button>
    <project-files :project="currentProject" />
  </div>
</template>

<script setup>
import { inject, useTemplateRef, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useResizeObserver, useDebounceFn } from '@vueuse/core'
import { ElMessageBox } from 'element-plus'
import ProjectFiles from './ProjectFiles.vue'
const { state, getters, commit, dispatch } = useStore()
const $Mousetrap = inject('$Mousetrap')

const sidebarRef = useTemplateRef('sidebar')
const currentProject = computed(() => state.currentProject)
const currentFile = computed(() => state.currentFile)
const allowShortcuts = computed(() => getters.allowShortcuts)
const sidebarMinWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-min-width'))

useResizeObserver(sidebarRef, useDebounceFn((entries) => {
  const { width } = entries[0].contentRect
  if (width) commit('VIEW_SET_SIDEBAR_WIDTH', Math.max(width, sidebarMinWidth))
}, 1000))

watch(() => state.bus.project, (message) => {
  switch (message.text) {
    case 'create':
      createProject()
      break
    case 'rename':
      renameProject(message.projectName)
      break
    case 'delete':
      deleteProject(message.projectName)
  }
})

// Set sidebar width once settings are loaded
watch(() => state.view.sidebar.width, (width) => {
  sidebarRef.value.style.width = `${width}px`
}, { once: true })

// Make sure sidebar has correct width (after possible resizing) before hiding animation
watch(() => state.view.sidebar.visible, (isVisible) => {
  if (isVisible) return
  const sidebarWidth = parseInt(sidebarRef.value.style.width)
  if (sidebarWidth < sidebarMinWidth) sidebarRef.value.style.width = `${sidebarMinWidth}px`
})

// Shortcut handlers
$Mousetrap.bindGlobal(['mod+alt+t'], () => {
  if (allowShortcuts.value) commit('VIEW_TOGGLE_SIDEBAR')
})
$Mousetrap.bindGlobal(['mod+alt+n'], () => {
  if (allowShortcuts.value) createProject()
})
$Mousetrap.bindGlobal(['mod+alt+o'], () => {
  if (allowShortcuts.value) commit('VIEW_TOGGLE_DIALOG_PROJECTS')
})
$Mousetrap.bindGlobal(['mod+alt+r'], () => {
  if (allowShortcuts.value) renameProject(currentProject.value.name)
})
$Mousetrap.bindGlobal(['mod+alt+w'], () => {
  if (allowShortcuts.value) commit('PROJECT_SET_CURRENT', null)
})
$Mousetrap.bindGlobal(['mod+alt+='], () => {
  if (allowShortcuts.value) commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'add-files', filePath: currentFile.value.path } })
})

function createProject() {
  ElMessageBox.prompt('Project name:', 'Create Project', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    inputValidator: name => getters.getProjectByName(name) ? 'You already have a project with such name' : true
  }).then(result => {
    dispatch('createProject', {
      projectName: result.value,
      setCurrent: true
    })
  }).catch(() => {})
}

function renameProject(projectName) {
  if (!projectName) return
  ElMessageBox.prompt('Project Name:', 'Rename Project', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    inputValue: projectName,
    inputValidator: name => name !== projectName && getters.getProjectByName(name) ? 'You already have a project with such name' : true
  }).then(result => {
    commit('PROJECT_SET_NAME', { projectName, newName: result.value })
  }).catch(() => {})
}

function deleteProject(projectName) {
  ElMessageBox.confirm(`Are you sure you want to delete project "${projectName}"?`, 'Deleting a Project', {
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    type: 'warning'
  }).then(() => {
    dispatch('deleteProject', { projectName })
  }).catch(() => {})
}
</script>

<style scoped>
.project-sidebar {
  height: 100%;
  flex-shrink: 0;
  position: relative;
  min-width: var(--sidebar-min-width);
  max-width: var(--sidebar-max-width);
  font-family: var(--sidebar-font-family);
  resize: horizontal;
  overflow: hidden;

  &::-webkit-resizer {
    --resizer-color: rgb(from var(--ui-border-color) r g b / 0.6);
    border-width: 9px;
    border-style: solid;
    border-color: transparent var(--resizer-color) var(--resizer-color) transparent;
  }
}

.title {
  text-align: center;
  font-weight: 500;
  height: var(--bar-height);
  line-height: var(--bar-height);
  background: var(--title-bg);
  border-right: 1px solid var(--ui-border-color);
  border-bottom: 1px solid var(--ui-border-color);
  color: var(--title-color);
}

.create-button {
  height: var(--bar-height);
  width: 100%;
  border-radius: 0;
}
</style>
