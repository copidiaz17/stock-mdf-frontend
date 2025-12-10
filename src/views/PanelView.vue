<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Panel de Obras</h1>

    <!-- Botón para crear nueva obra -->
    <div class="mb-4">
      <button
        @click="$router.push({ name: 'CrearObra' })"
        class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Crear nueva obra
      </button>
    </div>

    <div class="mb-4">
  <button
    @click="$router.push({ name: 'CrearMaterial' })"
    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
  >
    Crear nuevo material
  </button>
</div>

    <div v-if="loading" class="text-gray-500">Cargando obras...</div>

    <div v-else>
      <div v-if="obras.length === 0" class="text-gray-500">
        No hay obras registradas.
      </div>

      <ul class="space-y-2">
        <li 
          v-for="obra in obras" 
          :key="obra.id" 
          class="p-4 border rounded hover:bg-gray-50 cursor-pointer"
          @click="seleccionarObra(obra)"
        >
          <h2 class="font-semibold">{{ obra.nombre }}</h2>
          <p class="text-gray-600">{{ obra.ubicacion }}</p>
        </li>
      </ul>
    </div>

    <p v-if="error" class="text-red-500 mt-3">{{ error }}</p>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";

export default {
  name: "PanelView",
  data() {
    return {
      obras: [],
      loading: true,
      error: null,
    };
  },
  methods: {
    async cargarObras() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/obras", {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.obras = res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar obras";
      } finally {
        this.loading = false;
      }
    },
    seleccionarObra(obra) {
      this.$router.push({ name: "ObraDetalle", params: { id: obra.id } });
    },
  },
  mounted() {
    this.cargarObras();
  },
};
</script>

<style scoped>
li:hover {
  background-color: #f0f0f0;
}
</style>



