<template>
  <div class="file-editor">
    <div v-show="file.isSearchMode" class="search-bar">
      <div class="search-panel">
        <el-input ref="searchInput" v-model="searchString" class="search-input" size="small" placeholder="Search" clearable />
        <el-input v-model="replaceString" class="search-input" size="small" placeholder="Replace" clearable />
        <el-button type="primary" size="small" @click="replaceAll">Replace All</el-button>
        <el-tag v-show="matchCount" class="search-matches" type="success">{{ matchCount }}</el-tag>
      </div>
      <div class="options-panel">
        <el-checkbox v-model="isMatchCase">Match Case</el-checkbox>
      </div>
    </div>

    <file-editor-toolbar
      v-if="editor"
      v-show="isToolbarVisible && !file.isSearchMode"
      :editor="editor"
      @hyperlink-change="showLinkEditor"
    />
    <editor-content :editor="editor" class="content" :style="editorStyle" />
  </div>
</template>

<script setup>
import { useTemplateRef, ref, reactive, computed, watch, nextTick, onMounted, onUnmounted  } from 'vue'
import { useStore } from 'vuex'
import { ElMessageBox } from 'element-plus'
import FileEditorToolbar from './FileEditorToolbar.vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import { ControlClickLink as Link } from './extensions/ControlClickLink'
import CustomCommands from './extensions/CustomCommands'
import FontSize from './extensions/FontSize'
import SearchAndReplace from './extensions/SearchAndReplace'
import TextTransform from './extensions/TextTransform'
import { isImageUrl } from '../utils'
import defaultSettings from '../assets/json/defaultSettings.json'
const { state, getters, commit } = useStore()

const props = defineProps({
  file: { type: Object, required: true },
})

const searchInputRef = useTemplateRef('searchInput')
const editor = ref(null)
const updateCounter = reactive({ value: 0, previousValue: 0})
// Search properties
const searchString = ref('')
const replaceString = ref('')
const matchCount = ref(0)
const isMatchCase = ref(false)

const isActive = computed(() => state.currentFile.id === props.file.id)
const isToolbarVisible = computed(() => state.view.editorToolbar.visible)
const editorStyle = computed(() => getters.editorStyle)

watch(isActive, async (isActive) => {
  if (!isActive) return
  await nextTick()
  if (props.file.isSearchMode) searchInputRef.value.focus()
  else editor.value.commands.focus()
}, { immediate: true })

watch(() => props.file.savedCounter, () => {
  updateCounter.value = 0
})

watch(() => props.file.isSearchMode, async (isSearchMode) => {
  if (isSearchMode) {
    editor.value.setEditable(false)
    await nextTick()
    searchInputRef.value.focus()
  } else {
    resetSearch()
    editor.value.setEditable(true)
    editor.value.commands.focus()
  }
})

watch([searchString, isMatchCase], () => {
  search()
})

onMounted(() => {
  editor.value = new Editor({
    content: props.file.data,
    extensions: [
      StarterKit.configure({
        heading: { levels: Array.from(Array(defaultSettings.editor.headings.length), (_, i) => i + 1) }
      }),
      Color,
      CustomCommands,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Image.configure({ allowBase64: true }),
      Link.configure({ openOnClick: false }),
      SearchAndReplace.configure(), // configure() is required for separate storages
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      TextTransform,
      Typography,
      Underline,
    ],
    editorProps: {
      attributes: {
        class: 'editable',
      },
    },
  })
  editor.value.on('update', handleContentUpdate)
  editor.value.commands.focus()
})

onUnmounted(() => {
  editor.value.off('update', handleContentUpdate)
  editor.value.destroy()
})

function handleContentUpdate({ editor }) {
  const { eventCount } = editor.state.history$.done
  const { previousValue } = updateCounter
  if (eventCount === previousValue) return // group update - do nothing
  else if (eventCount === previousValue - 1) updateCounter.value -= 1 // undo
  else updateCounter.value += 1 // update or redo
  updateCounter.previousValue = eventCount

  const { isEdited } = props.file
  if (updateCounter.value) {
    if (!isEdited) commit('FILE_SET_PROPS', { fileId: props.file.id, props: { isEdited: true } })
  } else {
    if (isEdited) commit('FILE_SET_PROPS', { fileId: props.file.id, props: { isEdited: false } })
  }
}

async function search() {
  editor.value.commands.setSearchData(searchString.value, isMatchCase.value)
  await nextTick()
  matchCount.value = editor.value.storage.searchAndReplace.results.length
}

function replaceAll() {
  if (!searchString.value) return
  editor.value.commands.setReplaceString(replaceString.value)
  editor.value.commands.replaceAll()
}

function resetSearch() {
  searchString.value = ''
  replaceString.value = ''
}

function showLinkEditor() {
  const isActiveLink = editor.value.isActive('link')
  ElMessageBox.prompt('Hyperlink:', isActiveLink ? 'Edit Hyperlink' : 'Add Hyperlink', {
    confirmButtonText: isActiveLink ? 'Update' : 'Add',
    cancelButtonText: 'Cancel',
    inputValue: isActiveLink ? editor.value.getAttributes('link').href : '',
  }).then(result => {
    if (isActiveLink) return editor.value.chain().focus().extendMarkRange('link').updateAttributes('link', { href: result.value }).run()
    else if (isImageUrl(result.value)) return editor.value.chain().focus().setImage({ src: result.value }).run()
    if (editor.value.view.state.selection.empty) editor.value.commands.selectParentNode()
    editor.value.chain().focus().setLink({ href: result.value }).run()
  }).catch(() => {
    editor.value.commands.focus()
  })
}

defineExpose({
  file: props.file,
  isActive,
  editor,
  showLinkEditor
})
</script>

<style scoped>
.file-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-bar {
  --gap: var(--toolbar-padding);

  height: var(--toolbar-height);
  display: flex;
  align-items: center;
  padding: 0 10px 0 var(--gap);
  border-bottom: 1px solid var(--ui-border-color);
}

.search-panel, .options-panel {
  display: flex;
  align-items: center;
}

.search-panel {
  flex: 1
}

.options-panel {
  flex-shrink: 0;
  margin-left: auto;
}

.search-input {
  max-width: 30%;
  margin-right: var(--gap);
}

.search-matches {
  margin-left: var(--gap);
  font-size: 1em;
}

.content {
  overflow: auto;
  flex: 1;
  padding: 12px 16px;
}

.content :deep(.editable) {
  outline: none;
  min-height: 100%;
}
</style>
