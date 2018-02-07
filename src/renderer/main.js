import Vue from 'vue'
import Mousetrap from 'mousetrap'
import {
  Dialog, Dropdown, DropdownMenu, DropdownItem, Input, Checkbox, Select, Option, Button, ButtonGroup,
  Table, TableColumn, Form, FormItem, Tabs, TabPane, Tag, ColorPicker,
  MessageBox, Message, Notification
} from 'element-ui'

// Vendor CSS
import '../../static/vendor/fonts/fonts.css'
import '../../static/vendor/fontawesome/css/fontawesome-all.min.css'
import '../../static/vendor/element-ui/theme/index.css'
import 'jstree/dist/themes/default/style.css'

// Element-UI locale
import lang from 'element-ui/lib/locale/lang/en'
import locale from 'element-ui/lib/locale'

import App from './App'
import router from './router'
import store from './store'

// https://github.com/ccampbell/mousetrap/tree/master/plugins/global-bind
(function (a) { let c = {}; let d = a.prototype.stopCallback; a.prototype.stopCallback = function (e, b, a, f) { return this.paused ? !0 : c[a] || c[f] ? !1 : d.call(this, e, b, a) }; a.prototype.bindGlobal = function (a, b, d) { this.bind(a, b, d); if (a instanceof Array) for (b = 0; b < a.length; b++)c[a[b]] = !0; else c[a] = !0 }; a.init() })(Mousetrap)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.Mousetrap = Vue.prototype.$Mousetrap = Mousetrap
Vue.config.productionTip = false

locale.use(lang)
Vue.use(Dialog)
Vue.use(Dropdown)
Vue.use(DropdownMenu)
Vue.use(DropdownItem)
Vue.use(Input)
Vue.use(Checkbox)
Vue.use(Select)
Vue.use(Option)
Vue.use(Button)
Vue.use(ButtonGroup)
Vue.use(Table)
Vue.use(TableColumn)
Vue.use(Form)
Vue.use(FormItem)
Vue.use(Tabs)
Vue.use(TabPane)
Vue.use(Tag)
Vue.use(ColorPicker)
Vue.prototype.$msgbox = MessageBox
Vue.prototype.$alert = MessageBox.alert
Vue.prototype.$confirm = MessageBox.confirm
Vue.prototype.$prompt = MessageBox.prompt
Vue.prototype.$notify = Notification
Vue.prototype.$message = Message

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
