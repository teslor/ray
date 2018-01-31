import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'the-main-view',
      component: require('@/components/TheMainView').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
