<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="login-title">SISTEMA DE CONTROL DE STOCK</h1>

      <form @submit.prevent="login" class="login-form">
        <img src="/falube.jpg" alt="Logo" class="logo" />

        <div class="input-group">
          <input 
            v-model="email" 
            type="email" 
            placeholder="Email" 
            required
          />
        </div>

        <div class="input-group">
          <input 
            v-model="password" 
            type="password" 
            placeholder="Contraseña" 
            required
          />
        </div>

        <button type="submit" class="btn-submit">Ingresar</button>

        <p v-if="error" class="error">{{ error }}</p>
        
        </form>
    </div>
  </div>
</template>



<script>
import api from "../config/axios.Config.js";
import '../assets/css/login.css';

export default {
  name: "LoginView",
  data() {
    return {
      email: "",
      password: "",
      error: null
    };
  },
  methods: {
    async login() {
      this.error = null;
      try {

        console.log('DEBUG EXECUTION: Enviando credenciales...');
        const res = await api.post("/auth/login", {
          email: this.email,
          password: this.password
        });

        // 1. Guardar el token
        localStorage.setItem("token", res.data.token);
        
        // 🟢 CORRECCIÓN CLAVE: Forzar recarga de página al path /dashboard
        // Esto reinicia la aplicación, permitiendo que Pinia lea el token de localStorage de forma síncrona.
        window.location.replace("/dashboard"); 

      } catch (err) {
        // Maneja el error que viene del backend (ej: Contraseña incorrecta)
        this.error = err.response?.data?.message || "Error al iniciar sesión";
      }
    }
  }
};
</script>

<style scoped>
/* estilos existentes */
img {
  max-width: 200px;
  height: auto;
}
</style>


