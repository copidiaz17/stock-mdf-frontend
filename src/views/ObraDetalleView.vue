<template>
  <div class="obra-detalle-container">

    <div class="obra-info">
      <h2>{{ obra.nombre }}</h2>
      <p>{{ obra.ubicacion }}</p>

      <div class="obra-actions">
        <button 
          v-if="authStore.canModify"
          @click="goToManageItems" 
          class="btn-primary manage-item-btn"
        >
          <i class="fas fa-tags"></i> Items de Obra
        </button>

        <!-- 🗑 BOTÓN ELIMINAR OBRA -->
        <button
          v-if="authStore.user?.rol === 'ADMIN'"
          @click="eliminarObra"
          class="btn-danger btn-delete-obra"
        >
          🗑 Eliminar Obra
        </button>
      </div>
    </div>

    <div class="panel-dividido">

      <!-- MATERIALES -->
      <div class="materiales">
        <h3>Materiales</h3>

        <input
          type="text"
          v-model="search"
          placeholder="Filtrar material..."
          class="input-control"
        />

        <table v-if="filteredMateriales.length">
          <thead>
            <tr>
              <th>Material</th>
              <th>Cantidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mat in filteredMateriales" :key="mat.id">
              <td>{{ mat.nombre }}</td>
              <td>{{ mat.MaterialObra.cantidad }}</td>
              <td>
                <template v-if="authStore.canModify">
                  <button
                    class="btn-success btn-small"
                    @click="irFormulario(mat, 'ingreso')"
                  >
                    Ingresar
                  </button>

                  <button
                    class="btn-danger btn-small"
                    @click="irFormulario(mat, 'salida')"
                  >
                    Sacar
                  </button>
                </template>
                <span v-else class="solo-lectura">Solo lectura</span>
              </td>
            </tr>
          </tbody>
        </table>

        <p v-else class="empty-text">
          Esta obra no tiene materiales cargados.
        </p>
      </div>

      <!-- MOVIMIENTOS -->
      <div class="movimientos">
        <h3>Últimos Movimientos</h3>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Material</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Obs.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mov in movimientos" :key="mov.id">
              <td>{{ formatFecha(mov.createdAt) }}</td>
              <td>{{ mov.Material.nombre }}</td>
              <td :class="mov.tipo">{{ mov.tipo }}</td>
              <td>{{ mov.cantidad }}</td>
              <td>{{ mov.observaciones }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useAuthStore } from "../stores/authStore";

export default {
  name: "ObraDetalleView",
  props: ["id"],

  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },

  data() {
    return {
      obra: {},
      materiales: [],
      movimientos: [],
      search: "",
    };
  },

  computed: {
    filteredMateriales() {
      if (!this.search) return this.materiales;
      return this.materiales.filter(m =>
        m.nombre.toLowerCase().includes(this.search.toLowerCase())
      );
    },
  },

  methods: {
    async cargarObra() {
      const res = await api.get(`/obras/${this.id}`);
      this.obra = res.data;
    },

    async cargarMateriales() {
      const res = await api.get(`/obras/${this.id}/materiales`);
      this.materiales = res.data;
    },

    async cargarMovimientos() {
      const res = await api.get(`/obras/${this.id}/movimientos`);
      this.movimientos = res.data;
    },

    irFormulario(material, accion) {
      this.$router.push({
        name: "MovimientoMaterial",
        params: { obraId: this.id, accion },
        query: { materialId: material.id },
      });
    },

    goToManageItems() {
      this.$router.push({
        name: "ItemsObra",
        params: { obraId: this.id },
      });
    },

    async eliminarObra() {
      const ok = confirm(
        `⚠️ ELIMINAR OBRA\n\n"${this.obra.nombre}"\n\nSe eliminarán materiales, movimientos e ítems.\n\n¿Continuar?`
      );
      if (!ok) return;

      await api.delete(`/obras/${this.id}`);
      alert("✅ Obra eliminada");
      this.$router.push("/dashboard");
    },

    formatFecha(fecha) {
      return new Date(fecha).toLocaleString();
    },
  },

  mounted() {
    this.cargarObra();
    this.cargarMateriales();
    this.cargarMovimientos();
  },
};
</script>

<style scoped>
.obra-info {
  text-align: center;
  margin-bottom: 20px;
}

.obra-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 15px;
}

.btn-delete-obra {
  background: #b00020;
  color: white;
  border-radius: 8px;
  padding: 10px 18px;
  font-weight: bold;
}

.btn-delete-obra:hover {
  background: #d00030;
}

.panel-dividido {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
}
</style>
