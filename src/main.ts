import './assets/main.css'
import './assets/app.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAuth } from './composables/useAuth'

void initAuth()

const app = createApp(App)

app.use(router)
app.mount('#app')
