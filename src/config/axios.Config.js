// src/config/axiosConfig.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
withCredentials: true, 
  timeout: 10000, // Evita que quede colgado si el servidor no 
   
  headers: {
    "Content-Type": "application/json"
  }

});

// --- INTERCEPTOR DE REQUEST ---
// Agrega el token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- INTERCEPTOR DE RESPONSE ---
// Maneja errores centralizados
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response) {
      // Si el token expiró (código 401)
      if (error.response.status === 401) {
        console.warn("Sesión expirada, vuelve a iniciar sesión.");
        localStorage.removeItem("token");
        
          // 🟢 CORRECCIÓN CLAVE: Redirigir al path raíz '/'
        window.location.href = "/"; // ⬅️ CAMBIADO de "/login" a "/"
      }
    }

    return Promise.reject(error);
  }
);

export default api;
