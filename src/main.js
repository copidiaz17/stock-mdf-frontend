// main.js (CORREGIDO)

import { createApp } from 'vue';
import { createPinia } from 'pinia'; // Importamos createPinia
import App from './App.vue';
import router from './router'; 
import './assets/tailwind.css'; 
import './assets/css/dashboard.css';
import { useAuthStore } from './stores/authStore'; // Importamos el store

const app = createApp(App);
const pinia = createPinia(); // Creamos la instancia de Pinia

app.use(router);
app.use(pinia); // 🟢 1. Pinia debe estar instalado antes de usar el store

// ❌ ANTES (Error en la línea 19): 
// const authStore = useAuthStore(); 
// authStore.init(); 

// 🟢 2. CORRECCIÓN: Llamamos al store para forzar su inicialización,
// pero eliminamos la llamada a .init() que ya no existe.
useAuthStore(); 


app.mount('#app');