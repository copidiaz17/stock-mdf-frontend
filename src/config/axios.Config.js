// src/config/axiosConfig.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,

  /*
    60s a propósito: en Render el servicio se duerme cuando no hay
    tráfico y la primera llamada del día tiene que esperar a que
    despierte, lo que puede llevar 30-50 segundos. Con un timeout
    corto, ese primer pedido falla siempre.
  */
  timeout: 60000,

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
    // Si el token expiró (código 401), volvemos al login
    if (error.response && error.response.status === 401) {
      console.warn("Sesión expirada, vuelve a iniciar sesión.");
      localStorage.removeItem("token");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;
