<template>
  <div class="panel-content-centered">
    <div class="card form-card">

      <h2 class="titulo-pagina">Crear Nuevo Usuario</h2>

      <form @submit.prevent="crearUsuario">

        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input
            v-model="form.nombre"
            type="text"
            class="input-control"
            required
            placeholder="Nombre completo"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="input-control"
            required
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            v-model="form.password"
            type="password"
            class="input-control"
            required
            placeholder="********"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Rol</label>
          <select
            v-model="form.rol"
            class="input-control"
            required
          >
            <option disabled value="">Seleccione un rol</option>
            <option value="admin">Administrador</option>
            <option value="operador">Operador</option>
            <option value="lector">Usuario lector</option>
          </select>
        </div>

        <div class="acciones-form">
          <button type="submit" class="btn-primary btn-success">
            💾 Crear Usuario
          </button>

          <button
            type="button"
            class="btn-primary btn-cancel"
            @click="$router.back()"
          >
            Cancelar
          </button>
        </div>

        <div v-if="error" class="alert error">
          {{ error }}
        </div>

        <div v-if="success" class="alert success">
          {{ success }}
        </div>

      </form>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useAuthStore } from "../stores/authStore";

export default {
  name: "CrearUsuarioView",

  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },

  data() {
    return {
      form: {
        nombre: "",
        email: "",
        password: "",
        rol: "",
      },
      error: "",
      success: "",
    };
  },

  mounted() {
    // 🔐 Seguridad frontend básica
    if (!this.authStore.canModify) {
      this.$router.push("/dashboard");
    }
  },

  methods: {
    async crearUsuario() {
      this.error = "";
      this.success = "";

      try {
        await api.post("/usuarios", this.form);

        this.success = "Usuario creado correctamente ✔";

        // limpiar formulario
        this.form = {
          nombre: "",
          email: "",
          password: "",
          rol: "",
        };

      } catch (err) {
        console.error(err);
        this.error =
          err.response?.data?.message ||
          "Error al crear el usuario";
      }
    },
  },
};
</script>

<style scoped>
/* === CONTENEDOR GENERAL === */
.panel-content-centered {
  display: flex;
  justify-content: center;
  padding: 30px 15px;
}

/* === CARD === */
.card.form-card {
  width: 100%;
  max-width: 480px;
  background-color: #1e1e1e;
  border: 1px solid #444;
  border-radius: 10px;
  padding: 24px;
}

/* === TITULO === */
.titulo-pagina {
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.5rem;
  color: #f0c040;
}

/* === FORM === */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
}

.form-label {
  font-weight: 600;
  margin-bottom: 6px;
  color: #ddd;
}

.input-control {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #555;
  background-color: #2a2a2a;
  color: #eee;
}

.input-control::placeholder {
  color: #999;
}

/* === BOTONES === */
.acciones-form {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-primary {
  padding: 10px 14px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.btn-success {
  background-color: #166534;
  color: #eafff2;
}

.btn-cancel {
  background-color: #555;
  color: #eee;
}

/* === ALERTAS === */
.alert {
  margin-top: 15px;
  padding: 10px;
  border-radius: 6px;
  font-weight: 600;
  text-align: center;
}

.alert.success {
  background-color: #1f7a3f;
  color: #eafff2;
}

.alert.error {
  background-color: #7a1f1f;
  color: #ffecec;
}
</style>
