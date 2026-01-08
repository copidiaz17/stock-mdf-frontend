import { createRouter, createWebHistory } from "vue-router";
import { h } from 'vue'; // 🟢 CORRECCIÓN: Importar h desde 'vue'
import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";

import ObraDetalleView from "../views/ObraDetalleView.vue";
import MovimientoMaterialView from "../views/MovimientoMaterialView.vue";
import CrearObraView from "../views/CrearObraView.vue";
import CrearMaterialView from "../views/CrearMaterialView.vue";
import ItemObraView from "../views/ItemObraView.vue"; 

import { useAuthStore } from '../stores/authStore'; 

// Componente placeholder para el inicio del Dashboard
const DashboardHomeView = { 
    // Usamos render() para evitar el error de compilación
    render() {
        const authStore = useAuthStore(); 
        
        return h('div', { class: 'panel-content-centered' }, [
            h('h1', { class: 'main-dashboard-title', style: 'font-size: 2.5em; color: #f0c040; margin-bottom: 15px;' }, 'BIENVENIDO AL CONTROL DE STOCK'),
            h('p', { style: 'color: #aaa;' }, 'Selecciona una obra del menú lateral para comenzar.'),
            h('p', { style: 'color: orange; margin-top: 15px;' }, `(Rol: ${authStore.role})`)
        ]);
    }
};


const routes = [
  // RUTA DE LOGIN
  {
    path: "/",
    name: "Login",
    component: LoginView,
    meta: { requiresAuth: false }, 
  },

  // RUTA PRINCIPAL DEL DASHBOARD (PROTEGIDA)
  {
    path: "/dashboard",
    name: "Dashboard", 
    component: DashboardView,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: DashboardHomeView,
      },
      
      {
        path: "obra/:id",
        name: "ObraDetalle",
        component: ObraDetalleView,
        props: true,
      },
      {
        path: "obra/:obraId/movimiento/:accion",
        name: "MovimientoMaterial",
        component: MovimientoMaterialView,
        props: true,
      },
      {
        path: "crear-obra",
        name: "CrearObra",
        component: CrearObraView,
      },
      {
        path: "crear-material",
        name: "CrearMaterial",
        component: CrearMaterialView,
      },
      {
        path: "items-obra/:obraId?", 
        name: "ItemsObra",
        component: ItemObraView, 
        props: true, 
        meta: { requiresAuth: true }
      },

{
  path: "/dashboard/crear-usuario",
  name: "CrearUsuario",
  component: () => import("../views/CrearUsuarioView.vue"),
}

    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// NAVIGATION GUARD CORREGIDO: LECTURA DIRECTA DESDE EL STORE DE PINIA
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore(); 
    
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const isAuthenticated = authStore.isLoggedIn; 

    // Bloque 1: Ruta Protegida sin Autenticación
    if (requiresAuth && !isAuthenticated) {
        next({ name: 'Login' });
    } 
    // Bloque 2: Autenticado intentando ir al Login
    else if (to.name === 'Login' && isAuthenticated) {
        next({ name: 'Dashboard' });
    } 
    // Bloque 3: Continuar navegación
    else {
        next();
    }
});

export default router;