<template>
  <div class="consumo-container">

    <div class="encabezado">
      <div>
        <h2>Consumo por Ítem de Obra</h2>
        <p class="subtitulo">{{ obra.nombre }}</p>
      </div>

      <button class="btn-volver" @click="volver">← Volver al detalle</button>
    </div>

    <!-- FILTROS -->
    <div class="filtros">
      <div class="filtros-grilla">
        <div class="campo">
          <label>Ítem de obra</label>
          <select v-model="filtros.itemObraId" class="control" @change="cargarConsumo">
            <option value="">Todos los ítems</option>
            <option v-for="item in itemsObra" :key="item.id" :value="item.id">
              {{ item.codigo ? `[${item.codigo}] ` : '' }}{{ item.nombre }}
            </option>
            <option value="sin-imputar">— Sin imputar —</option>
          </select>
        </div>

        <div class="campo">
          <label>Desde</label>
          <input type="date" v-model="filtros.desde" class="control" @change="cargarConsumo" />
        </div>

        <div class="campo">
          <label>Hasta</label>
          <input type="date" v-model="filtros.hasta" class="control" @change="cargarConsumo" />
        </div>
      </div>

      <div class="atajos">
        <button class="chip" @click="rangoEsteMes">Este mes</button>
        <button class="chip" @click="rangoMesPasado">Mes pasado</button>
        <button class="chip" @click="rangoUltimos(30)">Últimos 30 días</button>
        <button class="chip chip-limpiar" v-if="hayFiltros" @click="limpiarFiltros">
          ✕ Limpiar
        </button>
        <button class="chip chip-csv" v-if="items.length" @click="descargarCSV">
          ⬇ Descargar CSV
        </button>
      </div>
    </div>

    <p v-if="error" class="error-box">{{ error }}</p>

    <p v-else-if="cargando" class="estado">Calculando…</p>

    <div v-else-if="!items.length" class="estado vacio">
      <p>No hay salidas de material registradas para este filtro.</p>
      <p class="ayuda">
        El consumo se arma con las salidas imputadas a un ítem de obra.
        Si el período es viejo, puede que esos movimientos se hayan cargado
        antes de que el sistema guardara la imputación.
      </p>
    </div>

    <div v-else>
      <p class="resumen">
        {{ items.length }} ítem<span v-if="items.length !== 1">s</span> con consumo
        <span v-if="filtros.desde || filtros.hasta">
          · {{ textoRango }}
        </span>
      </p>

      <div v-for="item in items" :key="item.itemObraId ?? 'sin-imputar'" class="tarjeta-item">
        <div class="item-header">
          <div class="item-titulo">
            <span v-if="item.codigo" class="codigo">{{ item.codigo }}</span>
            <span :class="{ 'sin-imputar': !item.itemObraId }">{{ item.nombre }}</span>
          </div>
          <div class="item-meta">
            {{ item.materiales.length }} material<span v-if="item.materiales.length !== 1">es</span>
            · {{ item.movimientos }} movimiento<span v-if="item.movimientos !== 1">s</span>
          </div>
        </div>

        <div class="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th class="num">Cantidad</th>
                <th>Unidad</th>
                <th class="num">Movim.</th>
                <th>Primer consumo</th>
                <th>Último consumo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mat in item.materiales" :key="mat.materialId">
                <td>{{ mat.nombre }}</td>
                <td class="num destacado">{{ mat.cantidad }}</td>
                <td class="unidad">{{ mat.unidad }}</td>
                <td class="num">{{ mat.movimientos }}</td>
                <td>{{ formatFecha(mat.primerMovimiento) }}</td>
                <td>{{ formatFecha(mat.ultimoMovimiento) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="nota">
        Nota: no se muestra un total general por ítem porque sumar cantidades
        de distintas unidades (bolsas, m³, kg) no daría un número con sentido.
      </p>
    </div>

  </div>
</template>

<script>
import api from "../config/axios.Config.js";

function aISO(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export default {
  name: "ConsumoItemView",
  props: ["obraId"],

  data() {
    return {
      obra: {},
      itemsObra: [],
      items: [],
      cargando: false,
      error: "",
      filtros: { itemObraId: "", desde: "", hasta: "" },
    };
  },

  computed: {
    hayFiltros() {
      return Object.values(this.filtros).some((v) => v !== "");
    },

    textoRango() {
      const desde = this.filtros.desde ? this.formatFecha(this.filtros.desde) : "el inicio";
      const hasta = this.filtros.hasta ? this.formatFecha(this.filtros.hasta) : "hoy";
      return `del ${desde} al ${hasta}`;
    },
  },

  methods: {
    async cargarObra() {
      try {
        const res = await api.get(`/obras/${this.obraId}`);
        this.obra = res.data;
      } catch (err) {
        console.error("Error cargando obra", err);
      }
    },

    async cargarItems() {
      try {
        const res = await api.get(`/obras/${this.obraId}/items`);
        this.itemsObra = res.data;
      } catch (err) {
        console.error("Error cargando ítems", err);
      }
    },

    async cargarConsumo() {
      this.cargando = true;
      this.error = "";

      try {
        const params = {};
        for (const [clave, valor] of Object.entries(this.filtros)) {
          if (valor !== "") params[clave] = valor;
        }

        const res = await api.get(`/obras/${this.obraId}/consumo-por-item`, { params });
        this.items = res.data.items || [];
      } catch (err) {
        console.error(err);
        this.error =
          err.response?.data?.message || "No se pudo calcular el consumo por ítem.";
        this.items = [];
      } finally {
        this.cargando = false;
      }
    },

    reiniciarFiltros() {
      this.filtros = { itemObraId: "", desde: "", hasta: "" };
    },

    limpiarFiltros() {
      this.reiniciarFiltros();
      this.cargarConsumo();
    },

    rangoEsteMes() {
      const hoy = new Date();
      this.filtros.desde = aISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
      this.filtros.hasta = aISO(hoy);
      this.cargarConsumo();
    },

    rangoMesPasado() {
      const hoy = new Date();
      this.filtros.desde = aISO(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
      this.filtros.hasta = aISO(new Date(hoy.getFullYear(), hoy.getMonth(), 0));
      this.cargarConsumo();
    },

    rangoUltimos(dias) {
      const hoy = new Date();
      const desde = new Date();
      desde.setDate(hoy.getDate() - dias);
      this.filtros.desde = aISO(desde);
      this.filtros.hasta = aISO(hoy);
      this.cargarConsumo();
    },

    formatFecha(valor) {
      if (!valor) return "—";
      const [anio, mes, dia] = String(valor).slice(0, 10).split("-");
      if (!anio || !mes || !dia) return String(valor);
      return `${dia}/${mes}/${anio}`;
    },

    descargarCSV() {
      const escapar = (valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`;

      const filas = [
        ["Codigo item", "Item de obra", "Material", "Cantidad", "Unidad", "Movimientos", "Primer consumo", "Ultimo consumo"],
      ];

      for (const item of this.items) {
        for (const mat of item.materiales) {
          filas.push([
            item.codigo || "",
            item.nombre,
            mat.nombre,
            mat.cantidad,
            mat.unidad,
            mat.movimientos,
            this.formatFecha(mat.primerMovimiento),
            this.formatFecha(mat.ultimoMovimiento),
          ]);
        }
      }

      // BOM + separador ';' para que Excel en español lo abra en columnas.
      const csv = "﻿" + filas.map((f) => f.map(escapar).join(";")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `consumo-por-item-${(this.obra.nombre || "obra")
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase()}.csv`;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
    },

    volver() {
      this.$router.push({ name: "ObraDetalle", params: { id: this.obraId } });
    },
  },

  watch: {
    obraId: {
      immediate: true,
      handler() {
        this.reiniciarFiltros();
        this.cargarObra();
        this.cargarItems();
        this.cargarConsumo();
      },
    },
  },
};
</script>

<style scoped>
.consumo-container {
  padding: 20px;
  color: var(--color-text, #f0f0c0);
  max-width: 1100px;
  margin: 0 auto;
}

.encabezado {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

.encabezado h2 { margin: 0; color: var(--color-accent, #f0c040); font-size: 1.4rem; }
.subtitulo { margin: 4px 0 0; color: var(--color-text-muted, #aaa); }

.btn-volver {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-surface-2, #444);
  background: transparent;
  color: var(--color-text-muted, #bbb);
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-volver:hover { border-color: var(--color-accent, #f0c040); color: var(--color-accent, #f0c040); }

.filtros {
  background: var(--color-surface, #1a1a1a);
  border: 1px solid var(--color-surface-2, #2c2c2c);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 18px;
}

.filtros-grilla {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.campo { display: flex; flex-direction: column; gap: 4px; min-width: 0; }

.campo label {
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-muted, #aaa);
}

.control {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-surface-2, #333);
  border-radius: 8px;
  background: var(--color-bg, #2c2c2c);
  color: var(--color-text, #f0f0c0);
  font-size: 0.9rem;
}
.control:focus { outline: none; border-color: var(--color-accent, #f0c040); }

.atajos { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }

.chip {
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid var(--color-surface-2, #444);
  background: transparent;
  color: var(--color-text-muted, #bbb);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.chip:hover { border-color: var(--color-accent, #f0c040); color: var(--color-accent, #f0c040); }
.chip-limpiar { border-color: var(--color-red, #f44336); color: var(--color-red, #f44336); }
.chip-csv { border-color: var(--color-green, #4caf50); color: var(--color-green, #4caf50); }

.resumen { color: var(--color-text-muted, #aaa); font-size: 0.9rem; margin: 0 0 14px; }

.estado { color: var(--color-text-muted, #aaa); text-align: center; padding: 30px 10px; }
.vacio .ayuda { font-size: 0.85rem; max-width: 520px; margin: 8px auto 0; line-height: 1.5; }

.error-box {
  background: rgba(244, 67, 54, 0.15);
  color: var(--color-red, #f44336);
  border-radius: 8px;
  padding: 12px;
}

.tarjeta-item {
  background: var(--color-surface, #1a1a1a);
  border: 1px solid var(--color-surface-2, #2c2c2c);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 14px;
}

.item-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-surface-2, #2c2c2c);
}

.item-titulo { font-size: 1.05rem; font-weight: bold; }

.codigo {
  display: inline-block;
  background: var(--color-accent-dim, rgba(240, 192, 64, 0.18));
  color: var(--color-accent, #f0c040);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  margin-right: 8px;
}

.sin-imputar { color: var(--color-text-muted, #888); font-style: italic; font-weight: normal; }

.item-meta { font-size: 0.82rem; color: var(--color-text-muted, #aaa); }

.tabla-scroll { width: 100%; overflow-x: auto; }

table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }

th, td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--color-surface-2, #2c2c2c);
  white-space: nowrap;
}

th {
  color: var(--color-accent, #f0c040);
  font-size: 0.73rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

tbody tr:last-child td { border-bottom: none; }

.num { text-align: right; }
.destacado { font-weight: bold; font-size: 1rem; }
.unidad { color: var(--color-text-muted, #888); }

.nota {
  font-size: 0.8rem;
  color: var(--color-text-muted, #888);
  font-style: italic;
  margin-top: 16px;
  line-height: 1.5;
}
</style>
