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

    </div>

    <div class="panel-dividido">

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
                      <button class="btn-primary btn-success btn-small" @click="irFormulario(mat, 'ingreso')">
                        Ingresar
                      </button>

                      <button class="btn-primary btn-danger btn-small" @click="irFormulario(mat, 'salida')">
                        Sacar
                      </button>
                  </template>
                  <p v-else style="color: #aaa; font-size: 0.8em;">Solo Lectura</p>
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
                @click="irFormularioInicial()"
                style="width: auto;"
            >
                ➕ Agregar Material
            </button>
        </div>
        
      </div>

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
import { useAuthStore } from '../stores/authStore';

export default {
  name: "ObraDetalleView",

  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },

  props: ["id"],

  data() {
    return {
      obra: {},
      materiales: [], 
      movimientos: [],
      // 🟢 AÑADIDO: Campo para el buscador
      search: '', 
    };
  },
  
  computed: {
    // 🟢 PROPIEDAD COMPUTADA: Filtra la lista de materiales original
    filteredMateriales() {
      if (!this.search) {
        return this.materiales;
      }
      const searchTerm = this.search.toLowerCase();
      return this.materiales.filter(mat =>
        mat.nombre.toLowerCase().includes(searchTerm)
      );
    }
  },

  methods: {
    async cargarObra() {
      try {
        const res = await api.get(`/obras/${this.id}`);
        this.obra = res.data;
      } catch (error) {
        console.error("Error al cargar obra:", error);
      }
    },

    async cargarMateriales() {
      try {
        const res = await api.get(`/obras/${this.id}/materiales`);
        this.materiales = res.data;
      } catch (error) {
        console.error("Error al cargar materiales:", error);
        this.materiales = [];
      }
    },

    async cargarMovimientos() {
      try {
        const res = await api.get(`/obras/${this.id}/movimientos`);
        this.movimientos = res.data;
      } catch (error) {
        console.error("Error al cargar movimientos:", error);
        this.movimientos = [];
      }
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
        params: {
          obraId: this.id,
          accion: "ingreso",
        },
        query: { materialId: 0 }
      });
    },

    goToManageItems() {
      this.$router.push({
        name: 'ItemsObra',
        params: { obraId: this.id }
      });
    },

    formatFecha(fecha) {
      return new Date(fecha).toLocaleString();
    },
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
  },
};
</script>

<style scoped>
.obra-detalle-container { padding: 20px; }
.obra-info { text-align: center; margin-bottom: 20px; }
.panel-dividido { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }

/* Aseguramos que el input de búsqueda use los estilos globales */
.input-control {
    width: 100%;
    padding: 10px;
    border: 1px solid #333;
    border-radius: 8px;
    background-color: #2c2c2c;
    color: #f0f0c0;
}
</style>