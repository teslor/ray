<template>
  <div class="file-editor">
    <div v-show="isSearchMode" class="search-bar">
      <div class="search-panel">
        <el-input
          ref="searchInput"
          v-model="searchString"
          class="search-input"
          size="small"
          placeholder="Search"
          clearable
          @keydown.enter="goNextMatch"
        />
        <el-input v-model="replaceString" class="search-input" size="small" placeholder="Replace" clearable />
        <el-button type="primary" size="small" @click="replaceAll">Replace All</el-button>
        <el-button size="small" :icon="ArrowUp" class="arrow-button" :disabled="!matchCount" @click="goPreviousMatch" />
        <el-button size="small" :icon="ArrowDown" class="arrow-button" :disabled="!matchCount" @click="goNextMatch" />
        <el-tag v-show="searchString" class="search-matches" type="success">
          {{ matchIndex ? `${matchIndex}/${matchCount}` : matchCount }}
        </el-tag>
      </div>
      <div class="options-panel">
        <el-checkbox v-model="isMatchCase">Match Case</el-checkbox>
      </div>
    </div>

    <file-editor-toolbar
      v-if="editor"
      v-show="isToolbarVisible && !isSearchMode"
      :editor="editor"
      @hyperlink-change="showLinkEditor"
    />
    <editor-content :editor="editor" :class="`content file-${file.id}`" :style="editorStyle" />
  </div>
</template>

<script setup>
import { useTemplateRef, ref, reactive, computed, watch, nextTick, onMounted, onUnmounted  } from 'vue'
import { useStore } from 'vuex'
import { ElMessageBox } from 'element-plus'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import FileEditorToolbar from './FileEditorToolbar.vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Color, FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import { ControlClickLink as Link } from './extensions/ControlClickLink'
import CustomCommands from './extensions/CustomCommands'
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

// Search refs
const isSearchMode = ref(false)
const searchString = ref('')
const replaceString = ref('')
const matchCount = ref(0)
const matchIndex = ref(0)
const isMatchCase = ref(false)

const isActive = computed(() => state.currentFile.id === props.file.id)
const isToolbarVisible = computed(() => state.view.editorToolbar.visible)
const editorStyle = computed(() => getters.editorStyle)

watch(isActive, async (isActive) => {
  if (!isActive) return
  await nextTick()
  if (isSearchMode.value) searchInputRef.value.focus()
  else editor.value.commands.focus()
}, { immediate: true })

watch(() => props.file.savedCounter, () => {
  updateCounter.value = 0
})

watch([searchString, isMatchCase], () => {
  search()
})

onMounted(() => {
  editor.value = new Editor({
    content: props.file.data,
    extensions: [
      StarterKit.configure({
        heading: { levels: Array.from(Array(defaultSettings.editor.headings.length), (_, i) => i + 1) },
        trailingNode: false,
        link: false,
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
    ],
    editorProps: {
      attributes: {
        class: 'editable',
      },
    },
  })
  editor.value.on('update', handleContentUpdate)
  editor.value.on('searchMatchIndexChange', async ({ activeMatchIndex: newIndex }) => {
    matchIndex.value = newIndex + 1
    if (newIndex === -1) return
    await nextTick()
    const activeMatch = document.querySelector(`.file-${props.file.id} .search-match-active`)
    if (activeMatch) activeMatch.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
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

  if (isSearchMode.value) search() // update search
}

async function search() {
  editor.value.commands.setSearchData(searchString.value, isMatchCase.value)
  await nextTick()
  matchCount.value = editor.value.storage.searchAndReplace.results.length
}

function goNextMatch() {
  if (matchCount.value) editor.value.commands.activateSearchMatch(1)
}

function goPreviousMatch() {
  if (matchCount.value) editor.value.commands.activateSearchMatch(-1)
}

async function startSearch() {
  isSearchMode.value = true
  const { from, to } = editor.value.state.selection
  searchString.value = editor.value.state.doc.textBetween(from, to, ' ') || ''
  await nextTick()
  searchInputRef.value.focus()
}

function stopSearch() {
  isSearchMode.value = false
  searchString.value = ''
  replaceString.value = ''
  editor.value.commands.focus()
}

function replaceAll() {
  if (!searchString.value) return
  editor.value.commands.setReplaceString(replaceString.value)
  editor.value.commands.replaceAll()
  editor.value.commands.focus()
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
  startSearch,
  stopSearch,
  showLinkEditor,
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
  max-width: 25%;
  margin-right: var(--gap);
}

.search-matches {
  margin-left: var(--gap);
  font-size: 1em;
  font-weight: 500;
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

.arrow-button {
  padding: 0 6px;
  margin-left: var(--gap) !important;
  color: var(--element-placeholder-color);
}
</style>
