<template>
  <div class="file-editor-toolbar">
    <el-select v-model="heading" class="heading-selector button-group" placeholder="H1" size="small" @change="onHeadingChange">
      <el-option v-for="item in headings" :key="item" :label="item" :value="item">
        <span style="padding: 0;">{{ item }}</span>
      </el-option>
    </el-select>

    <el-select v-model="font" class="font-selector button-group" size="small" @change="onFontChange">
      <el-option v-for="item in fonts" :key="item" :label="item" :value="item">
        <span style="padding: 0;">{{ item }}</span>
      </el-option>
    </el-select>

    <el-select v-model="fontSize" class="font-size-selector button-group" size="small" @change="onFontSizeChange">
      <el-option v-for="item in fontSizes" :key="item.size" :label="item.name" :value="item.size">
        <span style="padding: 0;">{{ item.name }}</span>
      </el-option>
    </el-select>

    <el-button-group class="button-group" size="small">
      <el-button :class="{ 'is-active': editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()">
        <icon-bold :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :class="{ 'is-active': editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()">
        <icon-italic :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :class="{ 'is-active': editor.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()">
        <icon-underline :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :class="{ 'is-active': editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()">
        <icon-strikethrough :size="iconSize" :stroke="iconStroke" />
      </el-button>
    </el-button-group>

    <el-button-group class="button-group" size="small">
      <el-button :class="{ 'is-active': editor.isActive('superscript') }" @click="editor.chain().focus().toggleSuperscript().run()">
        <icon-superscript :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :class="{ 'is-active': editor.isActive('subscript') }" @click="editor.chain().focus().toggleSubscript().run()">
        <icon-subscript :size="iconSize" :stroke="iconStroke" />
      </el-button>
    </el-button-group>

    <el-button-group class="button-group" size="small">
      <el-button :class="{ 'is-active': editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()">
        <icon-quote :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :class="{ 'is-active': editor.isActive('code') }" @click="editor.chain().focus().toggleCode().run()">
        <icon-code :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :class="{ 'is-active': editor.isActive('codeBlock') }" @click="editor.chain().focus().toggleCodeBlock().run()">
        <icon-source-code :size="iconSize" :stroke="iconStroke" />
      </el-button>
    </el-button-group>

    <el-button-group class="button-group" size="small">
      <el-button :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }" @click="editor.chain().focus().setTextAlign('left').run()">
        <icon-align-left :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }" @click="editor.chain().focus().setTextAlign('center').run()">
        <icon-align-center :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }" @click="editor.chain().focus().setTextAlign('right').run()">
        <icon-align-right :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }" @click="editor.chain().focus().setTextAlign('justify').run()">
        <icon-align-justified :size="iconSize" :stroke="iconStroke" />
      </el-button>
    </el-button-group>

    <el-button-group class="button-group" size="small">
      <el-button :class="{ 'is-active': editor.isActive('taskList') }" @click="editor.chain().focus().toggleTaskList().run()">
        <icon-list-check :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :class="{ 'is-active': editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">
        <icon-list :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :class="{ 'is-active': editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">
        <icon-list-numbers :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :disabled="!editor.can().sinkListItem('listItem') && !editor.can().sinkListItem('taskItem')" @click="editor.chain().focus().sinkItem().run()">
        <icon-indent-increase :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :disabled="!editor.can().liftListItem('listItem') && !editor.can().liftListItem('taskItem')" @click="editor.chain().focus().liftItem().run()">
        <icon-indent-decrease :size="iconSize" :stroke="iconStroke" />
      </el-button>
    </el-button-group>

    <el-button-group class="button-group" size="small">
      <el-button @click="setTextColor(lastTextColor)">
        <icon-text-color :style="lastTextColor ? { color: lastTextColor } : {}" :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <color-selector :active-color="textColor" :colors="textColors" @select="setTextColor" />

      <el-button @click="setHighlightColor(lastHighlightColor)">
        <icon-highlight :style="lastHighlightColor ? { fill: lastHighlightColor } : {}" :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <color-selector :active-color="highlightColor" :colors="highlightColors" @select="setHighlightColor" />
    </el-button-group>

    <el-button-group class="button-group" size="small">
      <el-button :class="{ 'is-active': editor.isActive('link')}" @click="$emit('hyperlink-change')">
        <icon-link :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button @click="openImageDialog">
        <icon-photo :size="iconSize" :stroke="iconStroke" />
      </el-button>
    </el-button-group>

    <el-button-group class="button-group" size="small">
      <el-button @click="editor.chain().focus().clearFormatting().run()">
        <icon-clear-formatting :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :disabled="!editor.can().undo()" @click="editor.chain().focus().undo().run()">
        <icon-arrow-back-up :size="iconSize" :stroke="iconStroke" />
      </el-button>
      <el-button :disabled="!editor.can().redo()" @click="editor.chain().focus().redo().run()">
        <icon-arrow-forward-up :size="iconSize" :stroke="iconStroke" />
      </el-button>
    </el-button-group>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
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
import IconTextColor from '@tabler-icons/IconTextColor.mjs'
import IconHighlight from '@tabler-icons/IconHighlight.mjs'
import IconLink from '@tabler-icons/IconLink.mjs'
import IconPhoto from '@tabler-icons/IconPhoto.mjs'
import IconClearFormatting from '@tabler-icons/IconClearFormatting.mjs'
import IconArrowBackUp from '@tabler-icons/IconArrowBackUp.mjs'
import IconArrowForwardUp from '@tabler-icons/IconArrowForwardUp.mjs'
import ColorSelector from './ColorSelector.vue'
import defaultSettings from '../assets/json/defaultSettings.json'
const { state } = useStore()
const { openImageDialog } = window.electronAPI

const props = defineProps({
  editor: { type: Object, required: true },
})
defineEmits(['hyperlink-change'])

const { headings, fonts, fontSizes, textColors, highlightColors } = defaultSettings.editor
const defaultFontSize = '100%'
const heading = ref('')
const font = ref('')
const fontSize = ref(defaultFontSize)
const textColor = ref('')
const lastTextColor = ref('')
const highlightColor = ref('')
const lastHighlightColor = ref('')
const iconSize = 18
const iconStroke = 2

const editorFont = computed(() => state.settings.editor.font)

onMounted(() => {
  props.editor.on('selectionUpdate', handleSelectionUpdate)
  font.value = editorFont.value
})

onBeforeUnmount(() => {
  props.editor.off('selectionUpdate', handleSelectionUpdate)
})

function handleSelectionUpdate({ editor }) {
  // Heading
  if (editor.isActive('heading')) {
    const getLevel = () => {
      for (let i = 1; i <= headings.length; i += 1)
        if (editor.isActive('heading', { level: i })) return i
    }
    const level = getLevel()
    heading.value = level ? `H${level}` : ''
  } else heading.value = ''

  // Font style
  if (editor.isActive('textStyle')) {
    const textStyle = editor.getAttributes('textStyle')
    font.value = textStyle.fontFamily || editorFont.value
    fontSize.value = textStyle.fontSize || defaultFontSize
    textColor.value = textStyle.color || ''
  } else {
    font.value = editorFont.value
    fontSize.value = defaultFontSize
    textColor.value = ''
  }

  // Highlight Color
  if (editor.isActive('highlight')) {
    highlightColor.value = editor.getAttributes('highlight').color
  } else highlightColor.value = ''
}

function onHeadingChange() {
  props.editor.chain().focus().setHeading({ level: Number(heading.value[1]) }).run()
}

function onFontChange() {
  if (font.value === editorFont.value) props.editor.chain().focus().unsetFontFamily().run()
  else props.editor.chain().focus().setFontFamily(font.value).run()
}

function onFontSizeChange() {
  if (fontSize.value === defaultFontSize) props.editor.chain().focus().unsetFontSize().run()
  else props.editor.chain().focus().setFontSize(fontSize.value).run()
}

function setTextColor(color) {
  if (color === textColor.value) return
  if (color) props.editor.chain().focus().setColor(color).run()
  else props.editor.chain().focus().unsetColor().run()
  textColor.value = color
  lastTextColor.value = color
}

function setHighlightColor(color) {
  if (color === highlightColor.value) return
  if (color) props.editor.chain().focus().setHighlight({ color }).run()
  else props.editor.chain().focus().unsetHighlight().run()
  highlightColor.value = color
  lastHighlightColor.value = color
}
</script>

<style scoped>
.file-editor-toolbar {
  --gap: var(--toolbar-padding);

  padding: var(--gap) 0 0 var(--gap);
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-color);

  .el-button {
    padding: 0 0.5em;
  }
}

.button-group {
  margin-right: calc(var(--gap) * 2);
  margin-bottom: var(--gap);
}

.heading-selector {
  width: 3.5em;
}

.font-selector {
  width: 7.2em;
}

.font-size-selector {
  width: 5.2em;
}
</style>
