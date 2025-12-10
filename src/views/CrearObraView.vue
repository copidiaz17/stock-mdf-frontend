<template>
  <div class="panel-content-centered">
    <div class="card form-card">
      <h1 class="titulo-pagina">Crear nueva obra</h1>

      <div class="space-y-4">
        
        <div class="form-group">
          <label class="form-label">Nombre de la obra</label>
          <input 
            v-model="nombre" 
            type="text"
            class="input-control"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Ubicación</label>
          <input 
            v-model="ubicacion" 
            type="text"
            class="input-control"
          />
        </div>

        <button
          @click="guardarObra"
          class="btn-primary btn-success" 
        >
          Guardar Obra
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
  name: 'CrearObraView',
  data() {
    return {
      nombre: "",
      ubicacion: "",
      mensaje: "",
      error: ""
    };
  },
  methods: {
    async guardarObra() {
      try {
        this.mensaje = "";
        this.error = "";
        
        // Asumiendo que el endpoint para crear obras es /obras
        await api.post(
          "/obras",
          { 
            nombre: this.nombre, 
            ubicacion: this.ubicacion 
          }
        );

        this.mensaje = "Obra creada correctamente";
        this.nombre = "";
        this.ubicacion = "";
        
        // Opcional: Redirigir al dashboard o a la lista de obras tras el éxito
        // setTimeout(() => {
        //   this.$router.push({ name: 'Dashboard' }); 
        // }, 1500);

      } catch (err) {
        this.error = err.response?.data?.message || "Error al crear la obra";
        this.mensaje = "";
      }
    }
  }
};
</script>
