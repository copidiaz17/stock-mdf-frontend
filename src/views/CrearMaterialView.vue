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
            @input="buscarParecidos"
          />
        </div>

        <!-- Aviso ANTES de crear un repetido -->
        <div v-if="parecidos.length" class="aviso-parecidos">
          <p v-if="bloqueado"><b>Ya existe:</b> usá ese en vez de crear otro.</p>
          <p v-else><b>¿No será alguno de estos?</b> Ya están en el catálogo:</p>
          <ul>
            <li v-for="p in parecidos" :key="p.id">
              {{ p.nombre }} <span class="unidad-parecido">({{ p.unidad || "sin unidad" }})</span>
            </li>
          </ul>
        </div>

        <div class="form-group">
          <label class="form-label">Unidad</label>
          <select v-model="unidad" class="input-control">
            <option value="" disabled>Elegí la unidad</option>
            <option v-for="u in unidades" :key="u" :value="u">{{ u }}</option>
          </select>
        </div>

        <p class="nota-herramientas">
          Las herramientas y máquinas no se cargan acá: van en la obra, pestaña
          "Herramientas y maquinarias".
        </p>

        <button
          @click="guardarMaterial(false)"
          class="btn-primary btn-success"
          :disabled="guardando || bloqueado"
        >
          {{ guardando ? "Guardando…" : "Guardar Material" }}
        </button>

        <button
          v-if="pedirConfirmacion && !bloqueado"
          @click="guardarMaterial(true)"
          class="btn-primary btn-confirmar"
          :disabled="guardando"
        >
          Es otro distinto, crearlo igual
        </button>

        <p v-if="mensaje" class="alert success">{{ mensaje }}</p>
        <p v-if="error" class="alert error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { UNIDADES } from "../utils/formato.js";

export default {
  name: 'CrearMaterialView',
  data() {
    return {
      nombre: "",
      unidad: "",
      unidades: [],
      parecidos: [],
      bloqueado: false,
      pedirConfirmacion: false,
      guardando: false,
      mensaje: "",
      error: "",
      temporizador: null,
    };
  },
  async created() {
    // Si el servidor no devuelve la lista (p. ej. un backend todavía sin
    // actualizar), se usa la del frontend: nunca queda sin unidades.
    this.unidades = UNIDADES;
    try {
      const res = await api.get("/materiales/unidades");
      if (Array.isArray(res.data) && res.data.length) this.unidades = res.data;
    } catch (err) {
      console.warn("Unidades del servidor no disponibles, se usa la lista local", err?.response?.status);
    }
  },
  methods: {
    // Busca parecidos mientras se escribe (con una pausa para no pedir en cada letra).
    buscarParecidos() {
      this.pedirConfirmacion = false;
      clearTimeout(this.temporizador);
      this.temporizador = setTimeout(async () => {
        const nombre = this.nombre.trim();
        if (nombre.length < 3) {
          this.parecidos = [];
          this.bloqueado = false;
          return;
        }
        try {
          const res = await api.get("/materiales/parecidos", { params: { nombre, clase: "material" } });
          if (nombre !== this.nombre.trim()) return;
          this.parecidos = res.data;
          this.bloqueado = res.data.some((p) => p.nivel === "igual");
        } catch (err) {
          console.error(err);
        }
      }, 350);
    },

    async guardarMaterial(confirmar) {
      if (this.guardando) return;
      this.mensaje = "";
      this.error = "";

      if (!this.nombre.trim() || !this.unidad) {
        this.error = "Completá el nombre y elegí la unidad";
        return;
      }

      this.guardando = true;
      try {
        // La autenticación ya se maneja en el Interceptor de Axios (api)
        await api.post("/materiales", {
          nombre: this.nombre,
          unidad: this.unidad,
          clase: "material",
          confirmarParecido: confirmar,
        });

        this.mensaje = "Material creado correctamente";
        this.nombre = "";
        this.unidad = "";
        this.parecidos = [];
        this.bloqueado = false;
        this.pedirConfirmacion = false;
      } catch (err) {
        const datos = err.response?.data;
        if (err.response?.status === 409 && datos?.parecidos) {
          this.parecidos = datos.parecidos;
          this.bloqueado = Boolean(datos.bloqueado);
          this.pedirConfirmacion = !datos.bloqueado;
          this.error = datos.message;
        } else {
          this.error = datos?.message || "Error al crear material";
        }
      } finally {
        this.guardando = false;
      }
    }
  }
};
</script>

<style scoped>
/*
  Colores del tema cuando existen (MDF) y paleta oscura si no (Falube):
  el archivo es el mismo en los dos proyectos.
*/
.aviso-parecidos {
  background: rgba(240, 160, 32, 0.14);
  color: var(--color-text, #f0f0c0);
  border: 1px solid var(--color-yellow, #f0a020);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 14px;
  font-size: 0.9rem;
}
.aviso-parecidos p { margin: 0 0 6px; }
.aviso-parecidos ul { margin: 0; padding-left: 18px; }
.unidad-parecido { color: var(--color-text-muted, #aaa); font-size: 0.85em; }
.nota-herramientas { font-size: 0.82rem; color: var(--color-text-muted, #aaa); margin: 0 0 12px; }
.btn-confirmar { margin-top: 8px; background-color: var(--color-yellow, #b45309); }
</style>
