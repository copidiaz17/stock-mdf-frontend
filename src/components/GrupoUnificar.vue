<template>
  <div>
    <div class="tabla-scroll">
      <table>
        <thead>
          <tr>
            <th title="El que queda">Queda</th>
            <th title="Se junta con el que queda">Juntar</th>
            <th>Nombre</th>
            <th>Unidad</th>
            <th class="num">Movim.</th>
            <th class="num">Stock</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in todos" :key="m.id" :class="{ apagado: !incluidos.has(m.id) }">
            <td>
              <input type="radio" :name="`queda-${grupo.principal.id}`" :checked="quedaId === m.id"
                :disabled="!incluidos.has(m.id)" @change="elegirQueda(m)" />
            </td>
            <td>
              <input type="checkbox" :checked="incluidos.has(m.id)" :disabled="quedaId === m.id"
                @change="alternar(m)" />
            </td>
            <td>
              <span v-if="m.nivel" :title="m.nivel === 'igual' ? 'Mismo nombre escrito distinto' : 'Parecido'" class="marca">
                {{ m.nivel === "igual" ? "✔" : "≈" }}
              </span>
              {{ m.nombre }}
            </td>
            <td class="unidad">{{ m.unidad || "—" }}</td>
            <td class="num">{{ m.movimientos }}</td>
            <td class="num">{{ m.stock }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="fila-campos final">
      <div class="campo">
        <label>Nombre final</label>
        <input v-model="nombre" class="control" />
      </div>
      <div class="campo">
        <label>Unidad final</label>
        <select v-model="unidad" class="control">
          <option value="">(dejar la que tiene)</option>
          <option v-for="u in unidades" :key="u" :value="u">{{ u }}</option>
        </select>
      </div>
      <div class="campo boton">
        <button class="btn btn-verde" :disabled="guardando || !juntar.length || !nombre.trim()" @click="enviar">
          Unificar {{ juntar.length + 1 }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "GrupoUnificar",
  props: {
    grupo: { type: Object, required: true },
    unidades: { type: Array, default: () => [] },
    guardando: { type: Boolean, default: false },
  },
  emits: ["unificar"],

  data() {
    return {
      quedaId: null,
      incluidos: new Set(),
      nombre: "",
      unidad: "",
    };
  },

  computed: {
    todos() {
      return [this.grupo.principal, ...this.grupo.miembros];
    },
    elegido() {
      return this.todos.find((m) => m.id === this.quedaId) || this.grupo.principal;
    },
    juntar() {
      return this.todos.filter((m) => m.id !== this.quedaId && this.incluidos.has(m.id));
    },
  },

  watch: {
    grupo: { immediate: true, handler() { this.reiniciar(); } },
  },

  methods: {
    reiniciar() {
      const p = this.grupo.principal;
      this.quedaId = p.id;
      // Los "iguales" vienen tildados; los "parecidos" los tilda una persona.
      this.incluidos = new Set([
        p.id,
        ...this.grupo.miembros.filter((m) => this.grupo.manual || m.nivel === "igual").map((m) => m.id),
      ]);
      this.ponerNombreYUnidad(p);
    },

    ponerNombreYUnidad(m) {
      this.nombre = String(m.nombre || "").trim().replace(/\s+/g, " ");
      this.unidad = m.unidadValida && this.unidades.includes(m.unidad) ? m.unidad : "";
    },

    elegirQueda(m) {
      this.quedaId = m.id;
      this.ponerNombreYUnidad(m);
    },

    alternar(m) {
      const nuevo = new Set(this.incluidos);
      if (nuevo.has(m.id)) nuevo.delete(m.id);
      else nuevo.add(m.id);
      this.incluidos = nuevo;
    },

    enviar() {
      const nombres = this.juntar.map((m) => `"${m.nombre.trim()}"`).join(", ");
      this.$emit("unificar", {
        principalId: this.quedaId,
        duplicadosIds: this.juntar.map((m) => m.id),
        nombre: this.nombre.trim(),
        unidad: this.unidad || null,
        resumen: `Queda "${this.nombre.trim()}".\nSe juntan con él: ${nombres}.`,
      });
    },
  },
};
</script>

<style scoped src="../assets/css/gestion.css"></style>
<style scoped>
.apagado td { opacity: 0.55; }
.marca { color: var(--color-accent, #f0c040); font-weight: bold; margin-right: 4px; }
.final { margin-top: 10px; align-items: end; }
.boton { justify-content: flex-end; }
</style>
