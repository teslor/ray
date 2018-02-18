<template>
  <div class="fe-wrapper" ref="ref_wrapper">
    <div class="fe-bar-container" v-show="file.searchMode">
      <div class="fe-bar-search">
        <el-input
            placeholder="Search" size="mini"
            ref="ref_input_search"
            v-model="searchString"
            clearable>
        </el-input>
        <el-checkbox v-model="isMatchCase">Match Case</el-checkbox>
        <el-checkbox v-model="isReplace">Replace</el-checkbox>
        <el-tag size="medium" v-show="searchData.finder">{{ searchData.matches }}</el-tag>
      </div>
      <div class="fe-bar-replace" v-show="isReplace">
        <el-input
            placeholder="Replace" size="mini"
            v-model="replaceString"
            clearable>
        </el-input>
        <el-button type="primary" size="mini" plain @click="handleButtonReplaceAllClick">Replace all</el-button>
      </div>
    </div>

    <div class="fe-editor-container" :style="editorStyle"></div>
  </div>
</template>

<script>
  import { mapState, mapGetters } from 'vuex'
  import debounce from 'lodash/debounce'
  import Quill from 'quill'
  import MagicUrl from 'quill-magic-url'
  import findAndReplaceDOMText from 'findandreplacedomtext'
  Quill.register('modules/magicUrl', MagicUrl)

  export default {
    name: 'file-editor',

    props: {
      file: Object,
      active: Boolean
    },

    data () {
      return {
        editor: null,

        // DOM elements
        editorContainerElement: null,
        barContainerElement: null,
        toolbarElement: null,
        editorElement: null,

        // Search properties
        searchString: '',
        replaceString: '',
        searchData: {
          initSelection: 0,
          initContents: null,
          finder: null,
          matches: 0
        },
        isMatchCase: false,
        isReplace: false
      }
    },

    computed: {
      ...mapState({
        editorSettings: state => state.settings.editor
      }),
      ...mapGetters([
        'editorStyle'
      ])
    },

    watch: {
      active: {
        handler: function (active) {
          if (!active) return
          this.$nextTick(() => {
            if (this.file.searchMode) this.$refs.ref_input_search.focus()
            else this.editor.focus()
          })
        },
        immediate: true
      },

      // ********** Search/replace stuff **********

      'file.searchMode' (searchMode) {
        if (searchMode) { // search/replace mode is on
          this.searchData.initSelection = this.editor.getSelection(true).index
          this.searchData.initContents = this.editor.getContents()
          this.editor.disable()
          this.toolbarElement.style.opacity = '0.3'
          this.$nextTick(() => {
            this.$refs.ref_input_search.focus()
          })
        } else {
          this.resetSearch()
          this.searchData.initSelection = 0
          this.searchData.initContents = null
          this.editor.enable()
          this.toolbarElement.style.opacity = ''
          this.editor.focus()
        }
      },
      searchString () {
        this.doSearch()
      },
      isMatchCase () {
        this.doSearch()
      }
    },

    mounted () {
      // Create Quill instance
      const toolbarOptions = {
        container: [
          [{ 'header': [1, 2, 3, 4, 5] }],
          [{ 'font': [] }],
          [{ 'size': ['small', false, 'large'] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'align': [] }],
          [{ 'script': 'sub' }, { 'script': 'super' }],
          [{ 'indent': '-1' }, { 'indent': '+1' }],
          // [{ 'direction': 'rtl' }],
          [{ 'color': [] }, { 'background': [] }],
          ['link', 'image', 'video'],
          ['clean']
        ]
      }
      const options = {
        placeholder: `Let's type something interesting here...`,
        theme: 'snow',
        modules: {
          toolbar: toolbarOptions,
          history: {
            delay: 400,
            maxStack: 200
          },
          magicUrl: true
        }
      }
      this.editorContainerElement = this.$refs.ref_wrapper.querySelector('.fe-editor-container')
      this.editor = new Quill(this.editorContainerElement, options)

      // Initial file data were provided
      if (this.file.data) {
        this.loadContents()
      }

      // Cache additional DOM elements
      this.barContainerElement = this.$refs.ref_wrapper.querySelector('.fe-bar-container')
      this.toolbarElement = this.$refs.ref_wrapper.querySelector('.ql-toolbar')
      this.editorElement = this.$refs.ref_wrapper.querySelector('.ql-editor')

      // Add shortcuts for headers
      for (let i = 1; i < 6; i += 1) {
        const key = String(i)
        this.editor.keyboard.addBinding({ key, ctrlKey: true }, function (range) {
          this.quill.formatLine(range, 'header', key)
        })
      }
      // Add shortcut for format removing
      this.editor.keyboard.addBinding({ key: 'E', ctrlKey: true }, function (range) {
        this.quill.removeFormat(range)
      })
      // TODO: implement more accurate file change detection
      this.editor.on('text-change', (delta, oldDelta, source) => {
        if ((!this.file.path && this.editor.getLength() === 1) || !this.editor.history.stack.undo.length) {
          if (this.file.flags.wasChanged) this.$store.commit('FILE_SET_FLAGS', { fileId: this.file.id, flags: { wasChanged: false } })
          return
        }
        if (!this.file.flags.wasChanged) {
          this.$store.commit('FILE_SET_FLAGS', { fileId: this.file.id, flags: { wasChanged: true } })
        }
      })
    },

    methods: {
      loadContents () {
        this.editor.clipboard.dangerouslyPasteHTML(this.file.data)
        this.editor.history.clear()
      },

      // ********** Search/replace methods **********

      resetSearch () {
        if (this.searchData.finder &&
          this.searchData.finder.reverts.length > 0 &&
          !this.searchData.finder.options.replace) { // there are contents modifications (search highlight); do not revert replace
          try {
            this.searchData.finder.revert()
          } catch (err) { // fallback if an error occurred (restore contents)
            this.editor.setContents(this.searchData.initContents)
          }
        }
        this.searchData.finder = null
        if (!this.file.searchMode) this.editor.setSelection(this.searchData.initSelection)
      },
      doSearch: debounce(function () {
        this.resetSearch() // reset previous search
        if (!this.searchString) return

        this.regexpString = RegExp(this.escapeRegExp(this.searchString), this.isMatchCase ? 'g' : 'gi')
        this.searchData.finder = findAndReplaceDOMText(this.editorElement, {
          find: this.regexpString,
          wrap: 'em',
          wrapClass: 'markedText',
          forceContext: function (el) {
            // Using https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
            return el.matches('p') || el.matches('li')
          }
        })
        this.searchData.matches = this.searchData.finder.reverts.length
      }, 500),
      doReplace () {
        this.resetSearch() // reset previous search
        if (!this.searchString || !this.replaceString) return

        this.editor.enable() // keep changes in history
        this.regexpString = RegExp(this.escapeRegExp(this.searchString), this.isMatchCase ? 'g' : 'gi')
        this.searchData.finder = findAndReplaceDOMText(this.editorElement, {
          find: this.regexpString,
          replace: this.replaceString,
          forceContext: function (el) {
            // Using https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
            return el.matches('p') || el.matches('li')
          }
        })
        this.searchData.matches = this.searchData.finder.reverts.length
        setTimeout(() => {
          this.editor.disable()
        }, 10)
      },
      escapeRegExp (s) {
        return String(s).replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1')
      },

      // ********** Handlers **********

      handleButtonReplaceAllClick () {
        this.doReplace()
      }
    }
  }
</script>

<style scoped>
  .fe-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .fe-bar-container {
    margin-top: 2px;

    & .el-input {
      width: 40%;
      margin-right: 4px;
    }

    & .el-checkbox, & .el-tag {
      margin-left: 12px;
    }

    & .el-checkbox {
      font-weight: normal;
    }

    & >>> .el-checkbox__label {
      font-size: 12px;
      padding-left: 8px;
    }

    & .el-tag {
      font-size: 14px;
    }
  }

  .fe-bar-search, .fe-bar-replace {
    display: flex;
    align-items: center;
    padding: 2px 4px;
  }

  .fe-editor-container {
    overflow: auto;
    flex: 1;
  }
</style>
