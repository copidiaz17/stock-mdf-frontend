<template>
  <div class="panel-content-centered">
    
    <div class="card form-card">

      <h1 class="titulo-pagina">
        {{ accion === "ingreso" ? "Ingresar Material" : "Sacar Material" }}
      </h1>

      <div v-if="mensaje" class="alert success">{{ mensaje }}</div>
      <div v-if="error" class="alert error">{{ error }}</div>

      <form @submit.prevent="guardarMovimiento" class="form-container">

        <div class="form-group">
          <label class="form-label">Fecha del Movimiento</label>
          <input
            type="date"
            v-model="fechaMovimiento"
            class="input-control"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Material</label>

          <input
            type="text"
            v-model="search"
            placeholder="Escribe para filtrar materiales"
            class="input-control"
          />

          <ul 
            v-if="isSearching && filteredMaterials.length" 
            class="autocomplete-list"
          >
            <li
              v-for="mat in filteredMaterials"
              :key="mat.id"
              @click="seleccionarMaterial(mat)"
              class="autocomplete-item"
            >
              {{ mat.nombre }}
            </li>
          </ul>

          <p v-else-if="isSearching && !filteredMaterials.length" class="text-muted">
            No hay materiales que coincidan
          </p>
        </div>

        <div class="form-group" v-if="accion === 'salida'">
            <label class="form-label">Ítem de Obra / Partida (Obligatorio)</label>
            <select
                v-model="itemObraId"
                class="input-control"
                required
            >
                <option disabled value="">Seleccione el ítem de costo</option>
                <option v-for="item in itemsObra" :key="item.id" :value="item.id">
                    {{ item.codigo ? `[${item.codigo}] ` : '' }}{{ item.nombre }}
                </option>
            </select>
            <p v-if="itemsObra.length === 0" class="text-muted" style="margin-top: 5px;">
                ⚠️ No hay ítems de obra registrados para este proyecto.
            </p>
        </div>

        <div class="form-group">
          <label class="form-label">Cantidad</label>
          <input
            type="number"
            v-model.number="cantidad"
            min="1"
            required
            class="input-control"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Observaciones</label>
          <input
            type="text"
            v-model="observaciones"
            class="input-control"
          />
        </div>

        <button
          type="submit"
          :class="accion === 'ingreso' ? 'btn-primary btn-success' : 'btn-primary btn-danger'"
        >
          Guardar
        </button>
      </form>
      
      <button 
          @click="$router.push({ name: 'ObraDetalle', params: { id: obraId } })"
          class="btn-primary" 
          style="background-color: #6c757d; margin-top: 10px;">
          Volver al Detalle de Obra
      </button>

    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";

function getTodayDate() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default {
  name: "MovimientoMaterialView",
  data() {
    return {
      materiales: [],
      itemsObra: [], 
      materialId: null,
      itemObraId: "", 
      fechaMovimiento: getTodayDate(), 
      cantidad: 0,
      observaciones: "",
      accion: "",
      mensaje: "",
      error: "",
      obraId: null,
      search: "",
      isSearching: false, 
    };
  },

  computed: {
    filteredMaterials() {
      if (!this.search) return this.materiales; 
      
      return this.materiales.filter(m =>
        m.nombre.toLowerCase().includes(this.search.toLowerCase())
      );
    }
  },

  watch: {
    search(newVal) {
      this.isSearching = newVal.length > 0;
    }
  },

  methods: {
    async cargarMateriales() {
      try {
        const res = await api.get("/materiales"); 
        this.materiales = res.data;
      } catch (err) {
        console.error(err);
        this.error = "Error al cargar materiales";
      }
    },
    
    async cargarItemsObra() {
      if (this.obraId && this.accion === 'salida') {
        try {
          const res = await api.get(`/obras/${this.obraId}/items`);
          this.itemsObra = res.data;
        } catch (err) {
          console.error(err);
          this.error = "Error al cargar ítems de obra";
        }
      }
    },
    
    seleccionarMaterial(mat) {
      this.materialId = mat.id;
      this.search = mat.nombre;
      this.isSearching = false; 
    },
    
    async guardarMovimiento() {
      this.error = "";
      this.mensaje = "";

      if (!this.materialId || !this.cantidad) {
        this.error = "Completa todos los campos";
        return;
      }
      
      if (this.accion === 'salida' && !this.itemObraId) {
           this.error = "El egreso debe estar imputado a un Ítem de Obra.";
           return;
      }
      if (!this.fechaMovimiento) {
           this.error = "La fecha del movimiento es obligatoria.";
           return;
      }

      const payload = {
        materialId: this.materialId,
        cantidad: this.cantidad,
        observaciones: this.observaciones,
        fechaMovimiento: this.fechaMovimiento, 
        itemObraId: this.accion === 'salida' ? this.itemObraId : null
      };

      const url = `/obras/${this.obraId}/${this.accion}`;

      try {
        await api.post(url, payload);

        this.mensaje = "Movimiento guardado correctamente";

        this.cantidad = 0;
        this.observaciones = "";
        this.itemObraId = ""; 
        this.materialId = null;
        this.search = "";

      } catch (err) {
        console.error(err);
        this.error = err.response?.data?.message || err.response?.data?.error || "Error al guardar movimiento"; 
        this.mensaje = "";
      }
    }
  },

  mounted() {
    this.accion = this.$route.params.accion;
    this.obraId = this.$route.params.obraId;
    
    const materialIdParam = this.$route.params.materialId;

    if (!materialIdParam || materialIdParam === "0") {
        this.materialId = null;
        this.search = "";
    } else {
        this.cargarMateriales().then(() => {
            const mat = this.materiales.find(m => m.id == materialIdParam);
            if (mat) {
                this.materialId = mat.id;
                this.search = mat.nombre;
            }
        });
    }

    this.cargarItemsObra(); 
    this.cargarMateriales();
  }
};
</script>
