<template>
  <div class="gestion">
    <div class="encabezado">
      <div>
        <h2>
          <span class="codigo-maq">{{ maquina.codigo }}</span>
          · {{ maquina.nombre }}
        </h2>
        <p class="subtitulo">
          <span :class="['tag', estado.clase]">{{ estado.texto }}</span>
          <template v-if="maquina.Obra">
            &nbsp;{{ maquina.estado === 'en_uso' ? 'en' : 'última obra:' }} {{ maquina.Obra.nombre }}
          </template>
        </p>
      </div>
      <button class="btn btn-gris" @click="$router.push({ name: 'Maquinas' })">← Todas las máquinas</button>
    </div>

    <p v-if="error" class="error-box">{{ error }}</p>
    <p v-if="mensaje" class="ok-box">{{ mensaje }}</p>

    <div class="bloque">
      <div class="bloque-titulo">
        <h3>Datos</h3>
        <button v-if="puedeCargar && !editando" class="btn btn-azul" @click="empezarEdicion">✏ Editar</button>
      </div>

      <form v-if="editando" @submit.prevent="guardarDatos">
        <div class="fila-campos">
          <div class="campo">
            <label>Código interno</label>
            <input v-model="form.codigo" class="control" required />
          </div>
          <div class="campo">
            <label>Máquina</label>
            <input v-model="form.nombre" class="control" required />
          </div>
        </div>
        <div class="fila-campos">
          <div class="campo"><label>Marca</label><input v-model="form.marca" class="control" /></div>
          <div class="campo"><label>Modelo</label><input v-model="form.modelo" class="control" /></div>
          <div class="campo"><label>N° de serie</label><input v-model="form.numeroSerie" class="control" /></div>
        </div>
        <div class="campo">
          <label>Observaciones</label>
          <input v-model="form.observaciones" class="control" maxlength="255" />
        </div>
        <div class="modal-acciones">
          <button type="button" class="btn btn-gris" @click="editando = false">Cancelar</button>
          <button type="submit" class="btn btn-azul" :disabled="guardando">
            {{ guardando ? "Guardando…" : "Guardar" }}
          </button>
        </div>
      </form>

      <div v-else class="tabla-scroll">
        <table class="tabla-datos">
          <tbody>
            <tr><th>Marca</th><td>{{ maquina.marca || "—" }}</td></tr>
            <tr><th>Modelo</th><td>{{ maquina.modelo || "—" }}</td></tr>
            <tr><th>N° de serie</th><td>{{ maquina.numeroSerie || "—" }}</td></tr>
            <tr><th>Observaciones</th><td>{{ maquina.observaciones || "—" }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bloque">
      <h3>Historial</h3>
      <div v-if="historial.length" class="tabla-scroll">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Movimiento</th><th>Observaciones</th><th>Cargó</th></tr>
          </thead>
          <tbody>
            <tr v-for="h in historial" :key="h.id">
              <td class="nowrap">{{ formatFecha(h.fecha) }}</td>
              <td><span :class="['tag', textoMovimiento(h).clase]">{{ textoMovimiento(h).texto }}</span></td>
              <td>{{ h.observaciones }}</td>
              <td class="muted">{{ h.Usuario?.nombre || "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="vacio">Sin movimientos.</p>
      <p class="muted">Los traslados, reparaciones y bajas se cargan desde la obra donde está la máquina.</p>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useAuthStore } from "../stores/authStore";
import { formatFecha, ESTADOS_MAQUINA, textoMovimientoMaquina, mensajeError } from "../utils/formato.js";

export default {
  name: "MaquinaDetalleView",
  props: ["id"],

  setup() {
    return { authStore: useAuthStore() };
  },

  data() {
    return {
      maquina: {},
      historial: [],
      editando: false,
      form: {},
      guardando: false,
      error: "",
      mensaje: "",
    };
  },

  computed: {
    puedeCargar() {
      return this.authStore.canModify;
    },
    estado() {
      return ESTADOS_MAQUINA[this.maquina.estado] || { texto: this.maquina.estado || "", clase: "tag-gris" };
    },
  },

  watch: {
    id: { immediate: true, handler() { this.cargar(); } },
  },

  methods: {
    formatFecha,
    textoMovimiento: textoMovimientoMaquina,

    async cargar() {
      this.error = "";
      try {
        const res = await api.get(`/maquinas/${this.id}`);
        this.maquina = res.data.maquina;
        this.historial = res.data.historial;
      } catch (err) {
        this.error = mensajeError(err, "No se pudo cargar la máquina");
      }
    },

    empezarEdicion() {
      const { codigo, nombre, marca, modelo, numeroSerie, observaciones } = this.maquina;
      this.form = { codigo, nombre, marca, modelo, numeroSerie, observaciones };
      this.mensaje = "";
      this.editando = true;
    },

    async guardarDatos() {
      if (this.guardando) return;
      this.guardando = true;
      this.error = "";
      try {
        await api.put(`/maquinas/${this.id}`, this.form);
        this.editando = false;
        this.mensaje = "Datos guardados";
        await this.cargar();
      } catch (err) {
        this.error = mensajeError(err);
      } finally {
        this.guardando = false;
      }
    },
  },
};
</script>

<style scoped src="../assets/css/gestion.css"></style>
<style scoped>
.tabla-datos th { width: 160px; }
</style>
