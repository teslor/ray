import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import ElementPlus from 'element-plus'
import Mousetrap from 'mousetrap'

// CSS
import 'element-plus/dist/index.css'
import 'jstree/dist/themes/default/style.css'
import './assets/fonts/fonts.css'
import './assets/styles/vars.css'
import './assets/styles/editor.css'
import './assets/styles/element-plus.css' // overrides some ElementPlus styles

// https://github.com/ccampbell/mousetrap/tree/master/plugins/global-bind
(function (a) { const c = {}; const d = a.prototype.stopCallback; a.prototype.stopCallback = function (e, b, a, f) { return this.paused ? !0 : c[a] || c[f] ? !1 : d.call(this, e, b, a) }; a.prototype.bindGlobal = function (a, b, d) { this.bind(a, b, d); if (a instanceof Array) for (b = 0; b < a.length; b++)c[a[b]] = !0; else c[a] = !0 }; a.init() })(Mousetrap)

const app = createApp(App)
app.use(store)
app.use(ElementPlus)
app.config.globalProperties.$Mousetrap = Mousetrap
app.provide('$Mousetrap', Mousetrap)
app.mount('#app')
