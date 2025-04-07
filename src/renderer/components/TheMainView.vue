<template>
  <action-bar v-show="isActionBarVisible" />
  <div class="main-containers">
    <transition name="sidebar">
      <project-sidebar v-show="isSidebarVisible" />
    </transition>
    <file-container />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useStore } from 'vuex'
import ActionBar from './ActionBar.vue'
import ProjectSidebar from './ProjectSidebar.vue'
import FileContainer from './FileContainer.vue'
const { state, commit } = useStore()

const currentProject = computed(() => state.currentProject)
const isActionBarVisible = computed(() => state.view.actionBar.visible)
const isSidebarVisible = computed(() => state.view.sidebar.visible)
const actionBarHeight = getComputedStyle(document.documentElement).getPropertyValue('--action-bar-height')

watch(currentProject, (project) => {
  if (isSidebarVisible.value || !project.name) return
  commit('VIEW_TOGGLE_SIDEBAR', true)
})

watch(isActionBarVisible, async (isVisible) => {
  document.documentElement.style.setProperty('--action-bar-height', isVisible ? actionBarHeight : '0px')
}, { immediate: true })
</script>

<style>
.main-containers {
  height: calc(100% - var(--action-bar-height));
  display: flex;
  border-top: 1px solid var(--ui-border-color);
}

.sidebar-enter-active, .sidebar-leave-active {
  transition: width 0.15s cubic-bezier(0.2, 0.4, 0.5, 1);
}
.sidebar-enter-from, .sidebar-leave-to {
  min-width: 0 !important;
  width: 0 !important;
}
.sidebar-enter-to {
  min-width: 0 !important;
}
.sidebar-enter-to .project-tree, .sidebar-leave-to .project-tree {
  overflow: hidden; /* avoid scrollbar during animation */
}
</style>
