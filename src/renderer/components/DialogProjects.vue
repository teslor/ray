<template>
  <el-dialog
      title="My Projects"
      :visible="displayDialog"
      :close-on-click-modal="true"
      :before-close="hideDialog"
      @open="handleDialogOpen">
    <el-table class="dp-table" :data="tableData" height="295" empty-text="No Projects" ref="ref_table">
      <el-table-column label="Project Name">
        <template slot-scope="scope">
          <span style="font-size: 18px">{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Operations" width="152">
        <template slot-scope="scope">
          <el-button class="dp-button" type="success" @click="handleOpenProject(scope.$index, scope.row)"><i class="far fa-folder-open"></i></el-button>
          <el-button class="dp-button" type="success" @click="handleRenameProject(scope.$index, scope.row)"><i class="far fa-edit"></i></el-button>
          <el-button class="dp-button" type="danger" @click="handleDeleteProject(scope.$index, scope.row)"><i class="fas fa-times"></i></el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script>
  import { mapState } from 'vuex'

  export default {
    name: 'dialog-projects',

    computed: {
      ...mapState({
        tableData: state => state.projects.map(project => { return { name: project.name } }).sort((a, b) => a.name > b.name ? 1 : -1),
        currentProject: state => state.currentProject,
        displayDialog: state => state.view.dialogProjects.visible,
        displaySidebar: state => state.view.sidebar.visible
      })
    },

    methods: {
      hideDialog () {
        this.$store.commit('VIEW_TOGGLE_DIALOG_PROJECTS', false)
      },
      handleDialogOpen () {
        this.$nextTick(function () {
          this.$refs.ref_table.doLayout()
        })
      },
      handleOpenProject (index, row) {
        if (row.name === this.currentProject.name) {
          if (!this.displaySidebar) this.$store.commit('VIEW_TOGGLE_SIDEBAR', true)
        } else this.$store.commit('PROJECT_SET_CURRENT', row.name)
        this.hideDialog()
      },
      handleRenameProject (index, row) {
        this.$store.commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'rename', projectName: row.name } })
      },
      handleDeleteProject (index, row) {
        this.$store.commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'delete', projectName: row.name } })
      }
    }
  }
</script>

<style>
  .dp-table {
    width: 100%;
    overflow-y: auto;

    & .el-button {
      height: 30px;
      width: 41px;
      padding: 0;
    }

    & .el-table_1_column_2 {
      padding: 0;

      & .cell {
        display: flex;
      }
    }
  }

  .dp-button + .dp-button {
    margin-left: 2px;
  }
</style>
