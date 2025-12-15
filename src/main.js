import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

import './assets/tailwind.css';
import './assets/css/dashboard.css';

import { useAuthStore } from './stores/authStore';

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

// 🔴 MUY IMPORTANTE: inicializar auth ANTES del router
const authStore = useAuthStore();
authStore.init(); // ⬅️ esta línea es la clave

app.use(router);

app.mount('#app');
