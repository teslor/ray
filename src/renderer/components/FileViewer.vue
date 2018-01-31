<template>
  <webview :src="file.path" autosize ref="ref_webview"></webview>
</template>

<script>
  export default {
    name: 'file-viewer',

    props: {
      file: Object,
      active: Boolean
    },

    mounted () {
      this.$nextTick(() => {
        this.$refs.ref_webview.addEventListener('new-window', (e) => {
          const protocol = require('url').parse(e.url).protocol
          if (protocol === 'http:' || protocol === 'https:') {
            this.$electron.shell.openExternal(e.url)
          }
        })
      })
    }
  }
</script>

<style scoped>
  webview {
    width: 100%;
    height: 100%;
  }
</style>