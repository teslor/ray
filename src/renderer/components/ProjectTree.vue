<template>
  <div class='pt-wrapper'>
    <div class='pt-toolbar' v-show="project.name && displayProjectToolbar">
      <el-button-group>
        <el-button class='pt-action-button' @click="addRootFolder"><i class="far fa-folder"></i></el-button>
        <el-button class='pt-action-button' :disabled="!this.currentNode || this.currentNodeType === 'file'" @click="addFolder(false)">
          <i class="far fa-folder">&nbsp;<i class="fas fa-plus" style="font-size: 8px"></i></i>
        </el-button>
        <el-button class='pt-action-button' :disabled="!this.currentNode || this.currentNodeType === 'file'" @click="renameFolder(null)">
          <i class="far fa-folder">&nbsp;<i class="fas fa-font" style="font-size: 8px"></i></i>
        </el-button>
        <el-button class='pt-action-button' @click="requestAddRootFile"><i class="far fa-sticky-note"></i></el-button>
        <el-button class='pt-action-button' :disabled="!this.currentNode || this.currentNodeType === 'file'" @click="requestAddFile">
          <i class="far fa-sticky-note">&nbsp;<i class="fas fa-plus" style="font-size: 8px"></i></i>
        </el-button>
        <el-button class='pt-action-button' :disabled="!this.currentNode" @click="removeItem"><i class="fas fa-times"></i></el-button>
      </el-button-group>
    </div>
    <div class='pt-tree'></div>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import path from 'path'
  import debounce from 'lodash/debounce'
  import $ from 'jquery'
  import 'jstree'

  export default {
    name: 'project-tree',

    props: {
      project: Object
    },

    data () {
      return {
        treeElement: null,
        treeElementRef: null,
        treeData: null,
        currentNode: null,
        currentNodeType: '',
        loadingData: false
      }
    },

    computed: {
      ...mapState({
        displayProjectToolbar: state => state.view.projectToolbar.visible
      })
    },

    watch: {
      project () {
        this.loadTreeData()
      }
    },

    mounted () {
      this.treeElement = $('.pt-tree')
      this.treeElement.jstree({
        core: {
          multiple: false,
          check_callback: true
        },
        types: {
          default: { icon: 'fas fa-folder fa-lg' },
          file: { icon: 'fas fa-sticky-note' }
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
      this.treeElementRef = this.treeElement.jstree(true)

      if (this.project) this.loadTreeData()

      // Event listeners
      this.treeElement.on('changed.jstree', (e, data) => { // triggered when selection changes
        this.currentNode = data.selected[0]
        const nodeInfo = this.treeElementRef.get_node(this.currentNode)
        this.currentNodeType = nodeInfo.type
        if (!this.loadingData && nodeInfo.type === 'file' && nodeInfo.data && nodeInfo.data.path) {
          this.$store.dispatch('openFile', { filePath: nodeInfo.data.path, setCurrent: true })
        }
      })
      const treeEvents = 'move_node.jstree after_open.jstree after_close.jstree'
      this.treeElement.on(treeEvents, this.updateProjectData)
    },

    methods: {
      requestAddRootFile () {
        this.$store.commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'add-files', action: 'addRootFile' } })
      },
      requestAddFile () {
        this.$store.commit('BUS_ADD_MESSAGE', { section: 'project', message: { text: 'add-files', action: 'addFile' } })
      },
      addRootFolder () {
        this.addFolder(true)
      },
      addFolder (isRoot = false) {
        const parent = isRoot ? null : this.currentNode
        const newNode = this.treeElementRef.create_node(parent, { text: 'New Folder' })
        if (newNode) this.renameFolder(newNode)
      },
      renameFolder (node) {
        const folder = node || this.currentNode
        const oldName = this.treeElementRef.get_node(folder).text
        if (folder) this.treeElementRef.edit(folder, null, (node) => { if (node.text !== oldName) this.updateProjectData() })
      },
      addRootFile (filePath) {
        this.addFile(filePath, true)
      },
      addFile (filePath, isRoot = false) {
        const parent = isRoot ? null : (!this.currentNode || this.currentNodeType === 'file' ? null : this.currentNode)
        this.treeElementRef.create_node(parent, { type: 'file', text: path.basename(filePath, path.extname(filePath)), data: { path: filePath } })
        if (!isRoot) this.treeElementRef.open_node(parent)
        this.$nextTick(() => { this.updateProjectData() })
      },
      removeItem () {
        if (!this.currentNode) return
        this.treeElementRef.delete_node(this.currentNode)
        this.$nextTick(() => { this.updateProjectData() })
      },
      getTreeData () {
        const data = this.treeElementRef.get_json(null, {
          no_id: true, no_li_attr: true, no_a_attr: true
        })
        if (!data.length) return null
        this.cleanData(data)
        return data
      },
      loadTreeData () {
        this.loadingData = true
        this.treeElement.jstree(true).settings.core.data = this.project.data
        this.treeElement.jstree(true).refresh(true)
        setTimeout(() => { this.loadingData = false }, 100) // prevent activating/opening selected file when reloading
      },
      updateProjectData: debounce(function () {
        this.$store.commit('PROJECT_SET_DATA', { projectName: this.project.name, data: this.getTreeData() })
      }, 1000),
      cleanData (data) {
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
          if (data[i].children && data[i].children.length) this.cleanData(data[i].children)
          else delete data[i].children
        }
      }
    }
  }
</script>

<style>
  @import '../assets/styles/vars.css';

  .pt-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .pt-toolbar {
    background-color: var(--bg-color-1);
    padding: 2px 3px 4px 3px;
  }

  .pt-action-button {
    padding: 0;
    width: 40px;
    height: 25px;
  }

  .pt-tree {
    flex: 1;
    overflow: auto;
    background: linear-gradient(180deg, #fefefe 0%, #fcfcfc 100%);
    font-family: var(--font-family-2);
    font-size: 15px;
    padding: 2px 0;

    & .fa-folder {
      color: moccasin;
    }

    & .fa-sticky-note {
      color: var(--theme-color-2);
    }

    & .jstree-rename-input {
      outline: none;
    }

    & .jstree-node {
      margin-left: 12px;
    }

    & .jstree-wholerow-hovered {
      background: var(--theme-color-1-l96);
    }

    & .jstree-wholerow-clicked {
      background: var(--theme-color-1-l94);
    }
  }
</style>
