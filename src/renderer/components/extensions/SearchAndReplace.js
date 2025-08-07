import { Extension } from '@tiptap/core'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Plugin, PluginKey } from '@tiptap/pm/state'

const getRegex = (s, disableRegex, matchCase) => {
  return RegExp(disableRegex ? s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') : s, matchCase ? 'gu' : 'gui')
}

const processSearches = (doc, searchString, searchResultClass, activeMatchIndex) => {
  if (!searchString) return { decorationsToReturn: DecorationSet.empty, results: [] }
  
  let textNodesWithPosition = []
  let index = 0
  doc?.descendants((node, pos) => {
    if (node.isText) {
      if (textNodesWithPosition[index]) {
        textNodesWithPosition[index] = {
          text: textNodesWithPosition[index].text + node.text,
          pos: textNodesWithPosition[index].pos,
        }
      } else {
        textNodesWithPosition[index] = {
          text: `${node.text}`,
          pos,
        }
      }
    } else {
      index += 1
    }
  })

  textNodesWithPosition = textNodesWithPosition.filter(Boolean)
  const results = []
  for (let i = 0; i < textNodesWithPosition.length; i += 1) {
    const { text, pos } = textNodesWithPosition[i]
    const matches = Array.from(text.matchAll(searchString)).filter(([ matchText ]) => matchText.trim())

    for (let j = 0; j < matches.length; j += 1) {
      const m = matches[j]
      if (m[0] === '') break
      if (m.index !== undefined) {
        results.push({
          from: pos + m.index,
          to: pos + m.index + m[0].length,
        })
      }
    }
  }

  const decorations = []
  for (let i = 0; i < results.length; i += 1) {
    const r = results[i]
    const isActive = i === activeMatchIndex
    const classes = isActive ? `${searchResultClass} ${searchResultClass}-active` : searchResultClass
    decorations.push(Decoration.inline(r.from, r.to, { class: classes }))
  }

  return {
    decorationsToReturn: DecorationSet.create(doc, decorations),
    results,
  }
}

const replace = (replaceString, results, { state, dispatch }) => {
  const firstResult = results[0]
  if (!firstResult) return

  const { from, to } = firstResult
  if (dispatch) dispatch(state.tr.insertText(replaceString, from, to))
}

const rebaseNextResult = (replaceString, index, lastOffset, results) => {
  const nextIndex = index + 1
  if (!results[nextIndex]) return null

  const { from: currentFrom, to: currentTo } = results[index]
  const offset = (currentTo - currentFrom - replaceString.length) + lastOffset
  const { from, to } = results[nextIndex]
  results[nextIndex] = {
    to: to - offset,
    from: from - offset,
  }
  return [ offset, results ]
}

const replaceAll = (replaceString, results, { tr, dispatch }) => {
  let offset = 0
  let resultsCopy = results.slice()
  if (!resultsCopy.length) return

  for (let i = 0; i < resultsCopy.length; i += 1) {
    const { from, to } = resultsCopy[i]
    tr.insertText(replaceString, from, to)

    const rebaseNextResultResponse = rebaseNextResult(replaceString, i, offset, resultsCopy)
    if (!rebaseNextResultResponse) continue

    offset = rebaseNextResultResponse[0]
    resultsCopy = rebaseNextResultResponse[1]
  }
  dispatch(tr)
}

export const SearchAndReplace = Extension.create({
  name: 'searchAndReplace',

  addOptions() {
    return {
      searchResultClass: 'search-match',
      disableRegex: true,
    }
  },

  addStorage() {
    return {
      searchString: '',
      replaceString: '',
      matchCase: false,
      activeMatchIndex: -1,
      results: [],
      lastSearchString: '',
      lastMatchCase: false,
      lastActiveMatchIndex: -1,
    }
  },

  addCommands() {
    return {
      setSearchData: (searchString, matchCase) => ({ editor }) => {
        editor.storage.searchAndReplace.searchString = searchString
        editor.storage.searchAndReplace.matchCase = matchCase
        editor.storage.searchAndReplace.activeMatchIndex = -1
        editor.emit('searchMatchIndexChange', { activeMatchIndex: -1 })
        return false
      },
      setReplaceString: (replaceString) => ({ editor }) => {
        editor.storage.searchAndReplace.replaceString = replaceString
        return false
      },
      replace: () => ({ editor, state, dispatch }) => {
        const { replaceString, results } = editor.storage.searchAndReplace
        replace(replaceString, results, { state, dispatch })
        return true
      },
      replaceAll: () => ({ editor, tr, dispatch }) => {
        const { replaceString, results } = editor.storage.searchAndReplace
        replaceAll(replaceString, results, { tr, dispatch })
        return true
      },
      activateSearchMatch: (direction) => ({ editor }) => {
        const { results, activeMatchIndex } = editor.storage.searchAndReplace
        if (results.length === 0) return false

        let newIndex
        if (direction > 0) {
          newIndex = (activeMatchIndex + 1) % results.length
        } else {
          const index = activeMatchIndex === -1 ? 0 : activeMatchIndex
          newIndex = (index - 1 + results.length) % results.length
        }

        editor.storage.searchAndReplace.activeMatchIndex = newIndex
        editor.emit('searchMatchIndexChange', { activeMatchIndex: newIndex })
        return true
      }
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const { searchResultClass, disableRegex } = this.options

    return [
      new Plugin({
        key: new PluginKey('searchAndReplacePlugin'),
        state: {
          init: () => DecorationSet.empty,
          apply({ doc, docChanged }, oldState) {
            const {
              searchString, lastSearchString, matchCase, lastMatchCase, activeMatchIndex, lastActiveMatchIndex
            } = editor.storage.searchAndReplace

            const shouldUpdate = docChanged || searchString !== lastSearchString || 
                                 matchCase !== lastMatchCase || 
                                 activeMatchIndex !== lastActiveMatchIndex
            if (!shouldUpdate) return oldState
            
            editor.storage.searchAndReplace.lastSearchString = searchString
            editor.storage.searchAndReplace.lastMatchCase = matchCase
            editor.storage.searchAndReplace.lastActiveMatchIndex = activeMatchIndex
            
            if (!searchString) {
              editor.storage.searchAndReplace.results = []
              editor.storage.searchAndReplace.activeMatchIndex = -1
              return DecorationSet.empty
            }

            const {
              decorationsToReturn, results,
            } = processSearches(doc, getRegex(searchString, disableRegex, matchCase), searchResultClass, activeMatchIndex)
            editor.storage.searchAndReplace.results = results

            return decorationsToReturn
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})

export default SearchAndReplace
