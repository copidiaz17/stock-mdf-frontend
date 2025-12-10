<template>
  <div class="dashboard">

    <header class="header header-principal">
      
      <img src="/falube.jpg" alt="logo" class="logo" />
      
      <div class="header-main-area">
        <h1 class="main-dashboard-title">SISTEMA DE CONTROL DE STOCK</h1>
          
        <div class="action-buttons-container">
          <template v-if="authStore.canModify"> 
            <button 
              @click="$router.push({ name: 'CrearObra' })" 
              class="btn-action btn-create-obra"
            >
              <i class="fas fa-hammer"></i> Agregar Obra
            </button>

            <button 
              @click="$router.push({ name: 'CrearMaterial' })" 
              class="btn-action btn-create-material"
            >
              <i class="fas fa-cube"></i> Agregar Material
            </button>
          </template>
        </div>
      </div>
      
      <div class="user-profile-widget">
        <p class="welcome-text">¡Bienvenido!</p>
        <p class="user-name">{{ userName }}</p>
        
        <button @click="logout" class="btn-logout icon-only">
          <i class="fas fa-arrow-right-from-bracket"></i>
          <span class="sr-only">Cerrar Sesión</span> 
        </button>
      </div>
      
      <!-- BOTÓN HAMBURGUESA -->
      <button class="hamburger" @click="toggleSidebar">☰</button>
    </header>

    <div class="main-content">

      <!-- SIDEBAR -->
      <aside :class="['sidebar', { open: sidebarOpen }]">

        <h2 class="sidebar-title">Obras</h2>

        <ul class="obra-list">
          <li
            v-for="obra in obras"
            :key="obra.id"
            :class="{ selected: obra.id == obraActiva }"
            @click="seleccionarObra(obra.id)"
          >
            <span class="icon">🏗</span>
            <span class="obra-nombre">{{ obra.nombre }}</span>

            <div v-if="obra.id == obraActiva" class="active-indicator"></div>
          </li>
        </ul>
      </aside>

      <!-- PANEL CENTRAL -->
      <main class="panel-central">
        <router-view />
      </main>

    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '../stores/authStore'; 

export default {
  name: "DashboardView",

  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },

  data() {
    return {
      obras: [],
      obraActiva: null,
      sidebarOpen: false,
      userName: "Cargando...",
    };
  },

  created() {
    this.getUserDataFromToken();
  },

  methods: {
    // 🔧 CORREGIDO — ahora sí abre y cierra la sidebar
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },

    async cargarObras() {
      try {
        const res = await api.get("/obras");
        this.obras = res.data;
      } catch (err) {
        console.error("Error cargando obras", err);
        this.obras = [];
      }
    },

    getUserDataFromToken() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          this.authStore.loadUserFromToken(token);
          this.userName = decoded.nombre || decoded.email?.split('@')[0];
        } catch (error) {
          console.error("Error decodificando JWT:", error);
          this.logout();
        }
      } else {
        this.logout();
      }
    },

    logout() {
      this.authStore.logout();
      this.$router.push({ name: 'Login' });
    },

    seleccionarObra(id) {
      this.obraActiva = id;
      this.$router.push(`/dashboard/obra/${id}`);

      // ✔ correcto: solo cerrar sidebar en móvil al SELECCIONAR obra
      if (window.innerWidth < 768) {
        this.sidebarOpen = false;
      }
    },
  },

  mounted() {
    this.cargarObras();
  },
};
</script>

<style src="../assets/css/dashboard.css"></style>
