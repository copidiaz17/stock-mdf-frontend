<template>
  <div class="panel-content-centered">
    <div class="card form-card">
      <h1 class="titulo-pagina">Crear nuevo material</h1>

      <div class="space-y-4">
        <div class="form-group">
          <label class="form-label">Nombre del material</label>
          <input 
            v-model="nombre" 
            type="text"
            class="input-control"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Unidad</label>
          <input 
            v-model="unidad" 
            type="text"
            class="input-control"
          />
        </div>

        <button
          @click="guardarMaterial"
          class="btn-primary btn-success" 
        >
          Guardar Material
        </button>

        <p v-if="mensaje" class="alert success">{{ mensaje }}</p>
        <p v-if="error" class="alert error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";

export default {
  name: 'CrearMaterialView',
  data() {
    return {
      nombre: "",
      unidad: "",
      mensaje: "",
      error: ""
    };
  },
  methods: {
    async guardarMaterial() {
      try {
        this.mensaje = "";
        this.error = "";
        
        // La autenticación ya se maneja en el Interceptor de Axios (api)
        await api.post(
          "/materiales",
          { nombre: this.nombre, unidad: this.unidad }
        );

        this.mensaje = "Material creado correctamente";
        this.nombre = "";
        this.unidad = "";
      } catch (err) {
        this.error = err.response?.data?.message || "Error al crear material";
        this.mensaje = "";
      }
    }
  }
};
</script>
