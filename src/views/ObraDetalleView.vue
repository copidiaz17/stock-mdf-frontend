<template>
  <div class="obra-detalle-container">

    <div class="obra-info">
      <h2>{{ obra.nombre }}</h2>
      <p>{{ obra.ubicacion }}</p>

      <button
        v-if="authStore.canModify"
        @click="goToManageItems"
        class="btn-primary btn-manage-items manage-item-btn"
      >
        <i class="fas fa-tags"></i> Items de Obra
      </button>

      <button
        v-if="authStore.canModify"
        @click="eliminarObra"
        class="btn-primary btn-danger manage-item-btn"
        style="margin-top: 10px;"
      >
        🗑 Eliminar Obra
      </button>
    </div>

    <div class="panel-dividido">

      <!-- MATERIALES -->
      <div class="materiales">
        <h3>Materiales</h3>

        <div class="form-group search-box" style="margin-bottom: 15px;">
          <input
            type="text"
            v-model="search"
            placeholder="Filtrar material por nombre..."
            class="input-control"
          />
        </div>

        <div v-if="filteredMateriales.length > 0">
          <table>
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
                      class="btn-primary btn-success btn-small"
                      @click="irFormulario(mat, 'ingreso')"
                    >
                      Ingresar
                    </button>

                    <button
                      class="btn-primary btn-danger btn-small"
                      @click="irFormulario(mat, 'salida')"
                    >
                      Sacar
                    </button>
                  </template>
                  <p v-else style="color:#aaa;font-size:.8em;">Solo Lectura</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="materiales-empty-state">
          <p v-if="search">No se encontraron materiales con ese nombre.</p>
          <p v-else>Esta obra no tiene materiales asignados aún.</p>

          <button
            v-if="!search && authStore.canModify"
            class="btn-primary btn-success manage-item-btn"
            @click="irFormularioInicial"
            style="width:auto;"
          >
            ➕ Agregar Material
          </button>
        </div>
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
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mov in movimientos" :key="mov.id">
              <td>{{ formatFecha(mov.createdAt) }}</td>
              <td>{{ mov.Material.nombre }}</td>
              <td :class="mov.tipo === 'ingreso' ? 'ingreso' : 'salida'">
                {{ mov.tipo }}
              </td>
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
      search: ""
    };
  },

  computed: {
    filteredMateriales() {
      if (!this.search) return this.materiales;
      return this.materiales.filter(m =>
        m.nombre.toLowerCase().includes(this.search.toLowerCase())
      );
    }
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
        query: { materialId: material.id }
      });
    },

    irFormularioInicial() {
      this.$router.push({
        name: "MovimientoMaterial",
        params: { obraId: this.id, accion: "ingreso" },
        query: { materialId: 0 }
      });
    },

    goToManageItems() {
      this.$router.push({
        name: "ItemsObra",
        params: { obraId: this.id }
      });
    },

    formatFecha(fecha) {
      return new Date(fecha).toLocaleString();
    },

    async eliminarObra() {
      const ok = confirm(
        `⚠️ ATENCIÓN\n\nVas a eliminar la obra:\n"${this.obra.nombre}"\n\n` +
        `Se eliminarán materiales, movimientos e ítems asociados.\n\n¿Deseas continuar?`
      );
      if (!ok) return;

      await api.delete(`/obras/${this.id}`);
      alert("✅ Obra eliminada correctamente");
      this.$router.push("/dashboard");
    }
  },

  watch: {
    id: {
      immediate: true,
      handler() {
        this.cargarObra();
        this.cargarMateriales();
        this.cargarMovimientos();
      }
    }
  }
};
</script>

<style scoped>
.obra-detalle-container { padding: 20px; }
.obra-info { text-align: center; margin-bottom: 20px; }
.panel-dividido { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
.input-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #2c2c2c;
  color: #f0f0c0;
}
</style>
