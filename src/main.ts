import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import USelect from './components/USelect.vue'
import { router } from './router'
import './styles.css'

// iOS 從背景切回來不會重新載入，切回前景時主動檢查新版
registerSW({
  immediate: true,
  onRegisteredSW: (_url, r) => document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && r?.update()),
})

createApp(App).component('USelect', USelect).use(createPinia()).use(router).mount('#app')
