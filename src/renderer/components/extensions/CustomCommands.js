import { Extension } from '@tiptap/core'

export const CustomCommands = Extension.create({
  name: 'customCommands',

  addCommands() {
    return {
      liftItem: () => ({ editor, commands }) => {
        let itemType = ''
        if (editor.can().liftListItem('listItem')) itemType = 'listItem'
        else if (editor.can().liftListItem('taskItem')) itemType = 'taskItem'
        return itemType ? commands.liftListItem(itemType) : true
      },
      sinkItem: () => ({ editor, commands }) => {
        let itemType = ''
        if (editor.can().sinkListItem('listItem')) itemType = 'listItem'
        else if (editor.can().sinkListItem('taskItem')) itemType = 'taskItem'
        return itemType ? commands.sinkListItem(itemType) : true
      },
      clearFormatting: () => ({ chain }) => {
        return chain().unsetAllMarks().clearNodes().run()
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-[': () => this.editor.commands.liftItem(),
      'Mod-]': () => this.editor.commands.sinkItem(),
      'Mod- ': () => this.editor.commands.clearFormatting(),
    }
  },
})

export default CustomCommands
