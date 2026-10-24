import { createRouter, createWebHashHistory } from 'vue-router'

// hash 模式：GitHub Pages 不支援 SPA fallback
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('../views/HomeView.vue'), meta: { nav: true } },
    { path: '/add', component: () => import('../views/TxEditor.vue') },
    { path: '/tx/:id', component: () => import('../views/TxEditor.vue'), props: true },
    { path: '/stats', component: () => import('../views/StatsView.vue'), meta: { nav: true } },
    { path: '/accounts', component: () => import('../views/AccountsView.vue'), meta: { nav: true } },
    { path: '/accounts/new', component: () => import('../views/AccountForm.vue') },
    { path: '/accounts/:id', component: () => import('../views/AccountDetail.vue'), props: true },
    { path: '/accounts/:id/edit', component: () => import('../views/AccountForm.vue'), props: true },
    { path: '/recurring', component: () => import('../views/RecurringView.vue') },
    { path: '/recurring/new', component: () => import('../views/RecurringForm.vue') },
    { path: '/recurring/:id', component: () => import('../views/RecurringForm.vue'), props: true },
    { path: '/budget', component: () => import('../views/BudgetView.vue') },
    { path: '/search', component: () => import('../views/SearchView.vue') },
    { path: '/settings', component: () => import('../views/SettingsView.vue'), meta: { nav: true } },
    { path: '/settings/categories', component: () => import('../views/CategoriesView.vue') },
    { path: '/settings/books', component: () => import('../views/BooksView.vue') },
    { path: '/settings/data', component: () => import('../views/DataView.vue') },
    { path: '/settings/rules', component: () => import('../views/RulesView.vue') },
    { path: '/help', component: () => import('../views/HelpView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
