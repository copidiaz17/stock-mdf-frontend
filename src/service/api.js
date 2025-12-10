// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // backend
  timeout: 10000,
});

// Interceptor para añadir token a cada request si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
