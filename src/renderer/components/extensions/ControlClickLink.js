import Link from '@tiptap/extension-link'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { getAttributes } from '@tiptap/core'
const { openUrl } = window.electronAPI

export const ControlClickLink = Link.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      openOnClick: false
    }
  },

  addProseMirrorPlugins() {
    const plugins = this.parent?.() || []

    const ctrlClickHandler = new Plugin({
      key: new PluginKey('ctrlClickHandler'),
      props: {
        handleClick(view, pos, event) {
          if (!event.ctrlKey && !event.metaKey) return false
          
          const attrs = getAttributes(view.state, 'link')
          if (attrs.href) {
            openUrl(attrs.href)
            return true
          }

          return false
        }
      }
    })

    plugins.push(ctrlClickHandler)
    return plugins
  }
})

export default ControlClickLink
