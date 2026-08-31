<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="login-title">SISTEMA DE CONTROL DE STOCK</h1>

      <form @submit.prevent="login" class="login-form">
        <img src="/logo-mdf.jpg" alt="Logo MDF" class="logo" />

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

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? "Conectando..." : "Ingresar" }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useAuthStore } from "../stores/authStore";
import '../assets/css/login.css';

export default {
  name: "LoginView",

  data() {
    return {
      email: "",
      password: "",
      error: null,
      loading: false,
    };
  },

  methods: {
    async login() {
      this.error = null;
      this.loading = true;

      try {
        const res = await api.post("/auth/login", {
          email: this.email,
          password: this.password,
        });

        const token = res.data.token;

        localStorage.setItem("token", token);

        const authStore = useAuthStore();
        authStore.loadUserFromToken(token);

        this.$router.push({ name: "Dashboard" });

      } catch (err) {
        // En Render el backend se duerme: el primer login del día puede
        // tardar bastante en despertar el servicio.
        const isTimeout =
          err.code === "ECONNABORTED" || err?.message?.includes("timeout");

        if (isTimeout) {
          this.error = "El servidor tardó en responder. Intentá de nuevo en unos segundos.";
        } else {
          this.error = err.response?.data?.message || "Error al iniciar sesión";
        }
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
img {
  max-width: 200px;
  height: auto;
}
</style>
