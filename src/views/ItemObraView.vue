<template>
  <div class="panel-content-centered">
    
    <div class="card form-card">
      <h2 class="titulo-pagina">Gestión de Ítems de Obra (Partidas)</h2>

      <form @submit.prevent="createItem">
        
        <div class="form-group">
          <label for="obra" class="form-label">Obra Asociada</label>
          <select 
            v-model="form.obraId" 
            id="obra" 
            class="input-control" 
            required
            :disabled="!!obraId"
          >
            <option disabled value="">Seleccione una obra</option>
            <option v-for="obra in obras" :key="obra.id" :value="obra.id">
              {{ obra.nombre }}
            </option>
          </select>
          <p v-if="!!obraId" style="margin-top: 5px; color: #f0c04099; font-size: 0.9em;">
              Seleccionado desde el Detalle de Obra.
          </p>
        </div>

        <div class="form-group">
          <label for="nombre" class="form-label">Nombre del Ítem</label>
          <input 
            type="text" 
            v-model="form.nombre" 
            id="nombre" 
            class="input-control" 
            required 
            placeholder="Ej: Mampostería de ladrillo"
          >
        </div>

        <div class="form-group">
          <label for="codigo" class="form-label">Código (Opcional)</label>
          <input 
            type="text" 
            v-model="form.codigo" 
            id="codigo" 
            class="input-control" 
            placeholder="Ej: A.1.2"
          >
        </div>

        <button type="submit" class="btn-primary btn-success">
          Crear Ítem de Obra
        </button>
      </form>
      
      <div v-if="message" :class="['alert', { 'success': isSuccess, 'error': !isSuccess }]">
          {{ message }}
      </div>
    </div>
    
    <div v-if="selectedObraId" class="card list-margin-top">
        <h3 class="titulo-pagina" style="margin-top: 0; margin-bottom: 15px; font-size: 1.2rem;">
            Ítems Existentes para: {{ selectedObraNombre }}
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
                <tr style="border: 1px solid #444;">
                    <th style="border: 1px solid #444; padding: 0.5rem; text-align: left; background-color: #2c2c2c; color: #f0c040;">Código</th>
                    <th style="border: 1px solid #444; padding: 0.5rem; text-align: left; background-color: #2c2c2c; color: #f0c040;">Nombre</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in items" :key="item.id" style="border: 1px solid #444;">
                    <td style="border: 1px solid #444; padding: 0.5rem;">{{ item.codigo || 'N/A' }}</td>
                    <td style="border: 1px solid #444; padding: 0.5rem;">{{ item.nombre }}</td>
                </tr>
            </tbody>
        </table>

        <p v-if="items.length === 0" style="margin-top: 15px; font-style: italic; color: #aaa;">No hay ítems registrados para esta obra.</p>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";

export default {
  name: 'ItemObraView',
  
  props: {
    obraId: { // <<-- ACEPTA LA PROP QUE VIENE DEL ROUTER
        type: [String, Number],
        default: null
    }
  },
  
  data() {
    return {
      obras: [],
      items: [], 
      form: {
        obraId: null, 
        nombre: '',
        codigo: ''
      },
      message: '',
      isSuccess: false,
    };
  },
  computed: {
    selectedObraId() {
        return this.form.obraId;
    },
    selectedObraNombre() {
        const obra = this.obras.find(o => o.id === this.form.obraId);
        return obra ? obra.nombre : 'Seleccione Obra';
    }
  },
  watch: {
    selectedObraId(newId) {
      this.items = []; 
      if (newId) {
        this.fetchItems(newId);
      }
    }
  },
  mounted() {
    this.fetchObras();
    
    // <<-- LÓGICA PARA PRE-SELECCIONAR -->>
    if (this.obraId) {
        // Inicializa el formulario con la obraId pasada por el detalle
        this.form.obraId = parseInt(this.obraId);
    }
  },
  methods: {
    async fetchObras() {
      try {
        const response = await api.get('/obras'); 
        this.obras = response.data;
      } catch (error) {
        console.error("Error al cargar obras:", error);
      }
    },
    
    async fetchItems(obraId) {
      this.items = [];
      try {
        const response = await api.get(`/obras/${obraId}/items`); 
        this.items = response.data;
      } catch (error) {
        console.error("Error al cargar ítems:", error);
      }
    },

    async createItem() {
  this.message = '';
  this.isSuccess = false;

  try {
    if (!this.form.obraId) {
      throw new Error("Debe seleccionar una obra.");
    }

    const payload = {
      nombre: this.form.nombre,
      codigo: this.form.codigo
    };

    await api.post(
      `/obras/${this.form.obraId}/items`,
      payload
    );

    this.message = `Ítem '${this.form.nombre}' creado con éxito.`;
    this.isSuccess = true;

    this.form.nombre = '';
    this.form.codigo = '';

    this.fetchItems(this.form.obraId);

  } catch (error) {
    this.message =
      error.response?.data?.message ||
      error.message ||
      "Error al crear el Ítem de Obra.";
    this.isSuccess = false;
  }
}

  }
};
</script>