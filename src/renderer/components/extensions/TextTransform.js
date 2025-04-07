import { Extension } from '@tiptap/core'

const blockSeparator = '|--|' // any string that is not expected in the text
const sentenceSeparators = [blockSeparator, '. ', '? ', '! ', '.\n', '?\n', '!\n', '\n']
const titleSeparators = [blockSeparator, ' ', '\n']

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const transforms = {
  upperCase: s => s.toUpperCase(),
  lowerCase: s => s.toLowerCase(),
  sentenceCase: s => {
    let text = s.toLowerCase()
    sentenceSeparators.forEach(separator => {
      text = text.split(separator).map(sentence => capitalize(sentence)).join(separator)
    })
    return text
  },
  titleCase: s => {
    let text = s.toLowerCase()
    titleSeparators.forEach(separator => {
      text = text.split(separator).map(word => capitalize(word)).join(separator)
    })
    return text
  }
}

export const TextTransform = Extension.create({
  name: 'textTransform',

  addCommands() {
    return {
      transformText: transformName => ({ state }) => {
        const { selection, tr } = state
        const { from, to } = selection
        let text = state.doc.textBetween(from, to, blockSeparator)
        text = transforms[transformName](text).replaceAll(blockSeparator, '')
        
        state.doc.nodesBetween(from, to, (node, pos) => {
          const trimmedFrom = Math.max(pos, from)
          const trimmedTo = Math.min(pos + node.nodeSize, to)
          if (!node.text) return
          const nodeTextLength = trimmedTo - trimmedFrom
          tr.insertText(text.slice(0, nodeTextLength), trimmedFrom, trimmedTo)
          text = text.slice(nodeTextLength)
        })
        return true
      },
    }
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-/': () => this.editor.commands.transformText('upperCase'),
      'Mod-Shift-/': () => this.editor.commands.transformText('lowerCase'),
      'Mod-\\': () => this.editor.commands.transformText('sentenceCase'),
      'Mod-Shift-\\': () => this.editor.commands.transformText('titleCase'),
    }
  },
})

export default TextTransform
