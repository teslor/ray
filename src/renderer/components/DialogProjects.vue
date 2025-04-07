<template>
  <el-dialog
    v-model="showDialog"
    class="dialog-projects"
    title="Projects"
    align-center
    :close-on-click-modal="true"
    @close="handleDialogClose"
  >
    <el-table
      class="project-list"
      :data="tableData"
      height="295"
      empty-text="No Projects"
      @row-click="handleOpenProject"
    >
      <el-table-column>
        <template #default="scope">
          <span style="font-size: 18px">{{ scope.row.name }}</span>
        </template>
      </el-table-column>

      <el-table-column width="200">
        <template #default="scope">
          <el-button class="action-button" type="success" @click.stop="handleRenameProject(scope.$index, scope.row)">
            <icon-pencil :size="20" :stroke="2" />
          </el-button>
          <el-button class="action-button" type="danger" @click.stop="handleDeleteProject(scope.$index, scope.row)">
            <icon-trash-x :size="20" :stroke="2" />
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import IconPencil from '@tabler-icons/IconPencil.mjs'
import IconTrashX from '@tabler-icons/IconTrashX.mjs'
const { state, commit } = useStore()

const showDialog = ref(false)

const tableData = computed(() => state.projects.map(project => { return { name: project.name } }).sort((a, b) => a.name > b.name ? 1 : -1))
const currentProject = computed(() => state.currentProject)
const isDialogVisible = computed(() => state.view.dialogProjects.visible)
const isSidebarVisible = computed(() => state.view.sidebar.visible)

watch(isDialogVisible, (visible) => {
  showDialog.value = visible
})
watch(showDialog, (show) => {
  commit('VIEW_TOGGLE_DIALOG_PROJECTS', show)
})

function handleDialogClose() {
  commit('BUS_ADD_MESSAGE', { section: 'editor', message: { text: 'focus' } })
}

function handleOpenProject(row) {
  if (row.name === currentProject.value.name) {
    if (!isSidebarVisible.value) commit('VIEW_TOGGLE_SIDEBAR', true)
  } else commit('PROJECT_SET_CURRENT', row.name)
  commit('VIEW_TOGGLE_DIALOG_PROJECTS', false)
}

function handleRenameProject(index, row) {
  commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'rename', projectName: row.name } })
}

function handleDeleteProject(index, row) {
  commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'delete', projectName: row.name } })
}
</script>

<style scoped>
.project-list {
  width: 100%;
  overflow-y: auto;
  background-color: var(--ui-bg-color-base);
}

.action-button {
  height: 30px;
  width: 40px;
  padding: 0;
  margin-left: 4px !important;
}
</style>

<style>
.project-list {
  .el-table__inner-wrapper::before {
    display: none;
  }

  .el-table_1_column_2 .cell {
    text-align: right;
  }

  .el-table__row {
    cursor: pointer;
  }
}
</style>
