<template>
  <div class="gestion">
    <div class="encabezado">
      <div>
        <h2>🚜 Máquinas</h2>
        <p class="subtitulo">Dónde está cada máquina. Para agregar una, entrá a la obra → Herramientas y maquinarias.</p>
      </div>
    </div>

    <div class="filtros">
      <div class="campo">
        <label>Buscar</label>
        <input v-model="buscar" class="control" placeholder="Código, máquina o marca" />
      </div>
      <div class="campo">
        <label>Obra</label>
        <select v-model="obraId" class="control">
          <option value="">Todas las obras</option>
          <option v-for="o in obras" :key="o.id" :value="o.id">{{ o.nombre }}</option>
        </select>
      </div>
      <div class="campo">
        <label>Estado</label>
        <select v-model="estado" class="control" @change="cargar">
          <option value="activas">En uso y en reparación</option>
          <option value="en_uso">En uso</option>
          <option value="en_reparacion">En reparación</option>
          <option value="baja">De baja</option>
          <option value="todas">Todas</option>
        </select>
      </div>
    </div>

    <p v-if="error" class="error-box">{{ error }}</p>

    <div class="bloque">
      <p v-if="cargando" class="vacio">Cargando…</p>
      <template v-else-if="filtradas.length">
        <p class="muted">{{ filtradas.length }} máquina<span v-if="filtradas.length !== 1">s</span></p>
        <div class="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Máquina</th>
                <th>Marca / modelo</th>
                <th>Obra</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in filtradas" :key="m.id">
                <td>
                  <button class="link codigo-maq" @click="ver(m)">{{ m.codigo }}</button>
                </td>
                <td>{{ m.nombre }}</td>
                <td>{{ [m.marca, m.modelo].filter(Boolean).join(" ") || "—" }}</td>
                <td>{{ m.Obra?.nombre || "—" }}</td>
                <td><span :class="['tag', textoEstado(m).clase]">{{ textoEstado(m).texto }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <p v-else class="vacio">No hay máquinas con ese filtro.</p>
    </div>

    <div v-if="resumenPorObra.length && !obraId" class="bloque">
      <h3>Por obra</h3>
      <div class="tabla-scroll">
        <table>
          <thead>
            <tr><th>Obra</th><th class="num">En uso</th><th class="num">En reparación</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in resumenPorObra" :key="r.obra">
              <td>{{ r.obra }}</td>
              <td class="num">{{ r.en_uso }}</td>
              <td class="num">{{ r.en_reparacion }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { ESTADOS_MAQUINA, mensajeError } from "../utils/formato.js";

export default {
  name: "MaquinasView",

  data() {
    return {
      maquinas: [],
      obras: [],
      buscar: "",
      obraId: "",
      estado: "activas",
      cargando: false,
      error: "",
    };
  },

  computed: {
    filtradas() {
      const t = this.buscar.trim().toLowerCase();
      return this.maquinas.filter((m) => {
        if (this.obraId && String(m.obraId) !== String(this.obraId)) return false;
        if (!t) return true;
        return [m.codigo, m.nombre, m.marca, m.modelo].some((v) => String(v || "").toLowerCase().includes(t));
      });
    },

    resumenPorObra() {
      const porObra = new Map();
      for (const m of this.maquinas) {
        if (m.estado === "baja") continue;
        const obra = m.Obra?.nombre || "—";
        if (!porObra.has(obra)) porObra.set(obra, { obra, en_uso: 0, en_reparacion: 0 });
        porObra.get(obra)[m.estado]++;
      }
      return [...porObra.values()].sort((a, b) => a.obra.localeCompare(b.obra));
    },
  },

  methods: {
    textoEstado(m) {
      return ESTADOS_MAQUINA[m.estado] || { texto: m.estado, clase: "tag-gris" };
    },

    async cargar() {
      this.cargando = true;
      this.error = "";
      try {
        const res = await api.get("/maquinas", { params: { estado: this.estado } });
        this.maquinas = res.data;
      } catch (err) {
        this.error = mensajeError(err, "No se pudieron cargar las máquinas");
      } finally {
        this.cargando = false;
      }
    },

    async cargarObras() {
      try {
        const res = await api.get("/obras");
        this.obras = [...res.data].sort((a, b) => a.nombre.localeCompare(b.nombre));
      } catch (err) {
        console.error("Error cargando obras", err);
      }
    },

    ver(m) {
      this.$router.push({ name: "MaquinaDetalle", params: { id: m.id } });
    },
  },

  created() {
    this.cargar();
    this.cargarObras();
  },
};
</script>

<style scoped src="../assets/css/gestion.css"></style>
