<template>
  <div class="obra-detalle-container">

    <div class="obra-info">
      <h2>{{ obra.nombre }}</h2>
      <p>{{ obra.ubicacion }}</p>

      <div class="acciones-obra">
        <button
          @click="goToConsumo"
          class="btn-obra btn-obra-azul"
        >
          📊 Consumo por Ítem
        </button>

        <button
          v-if="authStore.canModify"
          @click="goToManageItems"
          class="btn-obra btn-obra-verde"
        >
          🏷 Items de Obra
        </button>

        <button
          v-if="authStore.canModify"
          @click="eliminarObra"
          class="btn-obra btn-obra-rojo"
        >
          🗑 Eliminar Obra
        </button>
      </div>
    </div>

    <div class="panel-dividido">

      <!-- MATERIALES -->
      <div class="bloque">
        <h3>Materiales en stock</h3>

        <div class="form-group search-box">
          <input
            type="text"
            v-model="search"
            placeholder="Filtrar material por nombre..."
            class="control"
          />
        </div>

        <div v-if="filteredMateriales.length > 0" class="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Cantidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mat in filteredMateriales" :key="mat.id">
                <td>{{ mat.nombre }}</td>
                <td>{{ mat.MaterialObra.cantidad }} <span class="unidad">{{ mat.unidad }}</span></td>
                <td class="col-acciones">
                  <template v-if="authStore.canModify">
                    <button class="btn-chico btn-verde" @click="irFormulario(mat, 'ingreso')">
                      Ingresar
                    </button>
                    <button class="btn-chico btn-rojo" @click="irFormulario(mat, 'salida')">
                      Sacar
                    </button>
                  </template>
                  <span v-else class="muted">Solo lectura</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="vacio">
          <p v-if="search">No se encontraron materiales con ese nombre.</p>
          <p v-else>Esta obra no tiene materiales asignados aún.</p>

          <button
            v-if="!search && authStore.canModify"
            class="btn-obra btn-obra-verde"
            @click="irFormularioInicial"
          >
            ➕ Agregar Material
          </button>
        </div>
      </div>

      <!-- MOVIMIENTOS -->
      <div class="bloque">
        <h3>Movimientos</h3>

        <!-- FILTROS -->
        <div class="filtros">
          <div class="filtros-grilla">
            <div class="campo">
              <label>Material</label>
              <select v-model="filtros.materialId" class="control" @change="aplicarFiltros">
                <option value="">Todos</option>
                <option v-for="mat in catalogoMateriales" :key="mat.id" :value="mat.id">
                  {{ mat.nombre }}
                </option>
              </select>
            </div>

            <div class="campo">
              <label>Ítem de obra</label>
              <select v-model="filtros.itemObraId" class="control" @change="aplicarFiltros">
                <option value="">Todos</option>
                <option v-for="item in itemsObra" :key="item.id" :value="item.id">
                  {{ item.codigo ? `[${item.codigo}] ` : '' }}{{ item.nombre }}
                </option>
                <option value="sin-imputar">— Sin imputar —</option>
              </select>
            </div>

            <div class="campo">
              <label>Tipo</label>
              <select v-model="filtros.tipo" class="control" @change="aplicarFiltros">
                <option value="">Todos</option>
                <option value="ingreso">Ingreso</option>
                <option value="salida">Salida</option>
              </select>
            </div>

            <div class="campo">
              <label>Desde</label>
              <input type="date" v-model="filtros.desde" class="control" @change="aplicarFiltros" />
            </div>

            <div class="campo">
              <label>Hasta</label>
              <input type="date" v-model="filtros.hasta" class="control" @change="aplicarFiltros" />
            </div>
          </div>

          <div class="atajos">
            <button class="chip" @click="rangoEsteMes">Este mes</button>
            <button class="chip" @click="rangoMesPasado">Mes pasado</button>
            <button class="chip" @click="rangoUltimos(30)">Últimos 30 días</button>
            <button class="chip chip-limpiar" @click="limpiarFiltros" v-if="hayFiltros">
              ✕ Limpiar
            </button>
          </div>
        </div>

        <p v-if="errorMovimientos" class="error-box">{{ errorMovimientos }}</p>

        <p class="resumen" v-if="!errorMovimientos">
          <span v-if="cargandoMovimientos">Cargando…</span>
          <span v-else-if="total === 0">Sin movimientos para este filtro.</span>
          <span v-else>
            Mostrando {{ movimientos.length }} de {{ total }} movimiento<span v-if="total !== 1">s</span>
          </span>
        </p>

        <div class="tabla-scroll" v-if="movimientos.length">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Material</th>
                <th>Ítem de obra</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mov in movimientos" :key="mov.id">
                <td class="col-fecha">
                  {{ formatFecha(mov.fechaEfectiva || mov.fechaMovimiento || mov.createdAt) }}
                  <span
                    v-if="cargadoOtroDia(mov)"
                    class="registro"
                    :title="`Cargado en el sistema el ${formatFechaHora(mov.createdAt)}`"
                  >
                    reg. {{ formatFecha(mov.createdAt) }}
                  </span>
                </td>
                <td>{{ mov.Material?.nombre || '—' }}</td>
                <td>
                  <span v-if="mov.ItemObra">
                    {{ mov.ItemObra.codigo ? `[${mov.ItemObra.codigo}] ` : '' }}{{ mov.ItemObra.nombre }}
                  </span>
                  <span v-else class="muted">sin imputar</span>
                </td>
                <td>
                  <span :class="mov.tipo === 'ingreso' ? 'tag-ingreso' : 'tag-salida'">
                    {{ mov.tipo }}
                  </span>
                </td>
                <td>{{ mov.cantidad }} <span class="unidad">{{ mov.Material?.unidad }}</span></td>
                <td>{{ mov.observaciones }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          v-if="movimientos.length < total"
          class="btn-mas"
          @click="verMas"
          :disabled="cargandoMovimientos"
        >
          Ver más ({{ total - movimientos.length }} restantes)
        </button>
      </div>

    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useAuthStore } from "../stores/authStore";

const PAGINA = 50;

// Fecha local en AAAA-MM-DD (sin pasar por UTC, que nos correría un día)
function aISO(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export default {
  name: "ObraDetalleView",
  props: ["id"],

  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },

  data() {
    return {
      obra: {},
      materiales: [],
      catalogoMateriales: [],
      itemsObra: [],
      movimientos: [],
      total: 0,
      limite: PAGINA,
      cargandoMovimientos: false,
      errorMovimientos: "",
      search: "",
      filtros: {
        materialId: "",
        itemObraId: "",
        tipo: "",
        desde: "",
        hasta: "",
      },
    };
  },

  computed: {
    filteredMateriales() {
      if (!this.search) return this.materiales;
      const buscado = this.search.toLowerCase();
      return this.materiales.filter((m) =>
        String(m.nombre || "").toLowerCase().includes(buscado)
      );
    },

    hayFiltros() {
      return Object.values(this.filtros).some((v) => v !== "");
    },
  },

  methods: {
    async cargarObra() {
      try {
        const res = await api.get(`/obras/${this.id}`);
        this.obra = res.data;
      } catch (err) {
        console.error("Error cargando la obra", err);
      }
    },

    async cargarMateriales() {
      try {
        const res = await api.get(`/obras/${this.id}/materiales`);
        this.materiales = res.data;
      } catch (err) {
        console.error("Error cargando materiales de la obra", err);
        this.materiales = [];
      }
    },

    /*
      El filtro de material usa el catálogo completo y no el stock de la
      obra: un material consumido del todo desaparece del stock, pero sus
      movimientos siguen existiendo y hay que poder buscarlos.

      Se carga UNA sola vez: los materiales son globales, no dependen de
      la obra. Recargarlo al cambiar de obra reasignaba el array y obligaba
      a Vue a redibujar los cientos de <option> del filtro cada vez, que es
      lo que trababa la pantalla.
    */
    async cargarCatalogoMateriales() {
      if (this.catalogoMateriales.length) return;

      try {
        const res = await api.get("/materiales");
        this.catalogoMateriales = [...res.data].sort((a, b) =>
          String(a.nombre || "").localeCompare(String(b.nombre || ""))
        );
      } catch (err) {
        console.error("Error cargando catálogo de materiales", err);
      }
    },

    async cargarItems() {
      try {
        const res = await api.get(`/obras/${this.id}/items`);
        this.itemsObra = res.data;
      } catch (err) {
        console.error("Error cargando ítems de obra", err);
      }
    },

    async cargarMovimientos() {
      this.cargandoMovimientos = true;
      this.errorMovimientos = "";

      // Si se cambia de obra antes de que llegue la respuesta, la vieja
      // ya no sirve: descartamos lo que no corresponda a la obra actual.
      const pedidoPara = String(this.id);

      try {
        const params = { limit: this.limite };
        for (const [clave, valor] of Object.entries(this.filtros)) {
          if (valor !== "") params[clave] = valor;
        }

        const res = await api.get(`/obras/${pedidoPara}/movimientos`, { params });

        if (pedidoPara !== String(this.id)) return;

        // Tolera la respuesta vieja (array pelado) por si el frontend
        // queda desplegado antes que el backend.
        const datos = res.data;
        if (Array.isArray(datos)) {
          this.movimientos = datos;
          this.total = datos.length;
        } else {
          this.movimientos = datos.movimientos || [];
          this.total = datos.total ?? this.movimientos.length;
        }
      } catch (err) {
        if (pedidoPara !== String(this.id)) return;
        console.error(err);
        this.errorMovimientos =
          err.response?.data?.message || "No se pudieron cargar los movimientos.";
        this.movimientos = [];
        this.total = 0;
      } finally {
        if (pedidoPara === String(this.id)) this.cargandoMovimientos = false;
      }
    },

    verMas() {
      this.limite += PAGINA;
      this.cargarMovimientos();
    },

    // Los filtros se aplican en forma explícita (y no con un watcher)
    // para no disparar dos consultas cuando se cambia de obra.
    aplicarFiltros() {
      this.limite = PAGINA;
      this.cargarMovimientos();
    },

    reiniciarFiltros() {
      this.filtros = { materialId: "", itemObraId: "", tipo: "", desde: "", hasta: "" };
    },

    limpiarFiltros() {
      this.reiniciarFiltros();
      this.aplicarFiltros();
    },

    rangoEsteMes() {
      const hoy = new Date();
      this.filtros.desde = aISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
      this.filtros.hasta = aISO(hoy);
      this.aplicarFiltros();
    },

    rangoMesPasado() {
      const hoy = new Date();
      this.filtros.desde = aISO(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
      this.filtros.hasta = aISO(new Date(hoy.getFullYear(), hoy.getMonth(), 0));
      this.aplicarFiltros();
    },

    rangoUltimos(dias) {
      const hoy = new Date();
      const desde = new Date();
      desde.setDate(hoy.getDate() - dias);
      this.filtros.desde = aISO(desde);
      this.filtros.hasta = aISO(hoy);
      this.aplicarFiltros();
    },

    irFormulario(material, accion) {
      this.$router.push({
        name: "MovimientoMaterial",
        params: { obraId: this.id, accion },
        query: { materialId: material.id },
      });
    },

    irFormularioInicial() {
      this.$router.push({
        name: "MovimientoMaterial",
        params: { obraId: this.id, accion: "ingreso" },
        query: { materialId: 0 },
      });
    },

    goToManageItems() {
      this.$router.push({ name: "ItemsObra", params: { obraId: this.id } });
    },

    goToConsumo() {
      this.$router.push({ name: "ConsumoItem", params: { obraId: this.id } });
    },

    /*
      Las fechas de movimiento vienen como "AAAA-MM-DD". Construir un
      Date con eso lo interpreta como UTC y en Argentina mostraría el
      día anterior, así que la formateamos como texto.
    */
    formatFecha(valor) {
      if (!valor) return "—";
      const [anio, mes, dia] = String(valor).slice(0, 10).split("-");
      if (!anio || !mes || !dia) return String(valor);
      return `${dia}/${mes}/${anio}`;
    },

    formatFechaHora(valor) {
      if (!valor) return "—";
      return new Date(valor).toLocaleString();
    },

    // ¿La carga en el sistema pasó un día distinto al del movimiento?
    cargadoOtroDia(mov) {
      const real = String(mov.fechaEfectiva || mov.fechaMovimiento || "").slice(0, 10);
      if (!real || !mov.createdAt) return false;
      return real !== aISO(new Date(mov.createdAt));
    },

    async eliminarObra() {
      const ok = confirm(
        `⚠️ ATENCIÓN\n\nVas a eliminar la obra:\n"${this.obra.nombre}"\n\n` +
          `Se eliminarán materiales, movimientos e ítems asociados.\n\n¿Deseas continuar?`
      );
      if (!ok) return;

      await api.delete(`/obras/${this.id}`);
      alert("✅ Obra eliminada correctamente");
      this.$router.push("/dashboard");
    },
  },

  // El catálogo de materiales es global: se pide una vez y no en cada
  // cambio de obra.
  created() {
    this.cargarCatalogoMateriales();
  },

  watch: {
    id: {
      immediate: true,
      handler() {
        this.reiniciarFiltros();
        this.limite = PAGINA;
        this.search = "";
        this.cargarObra();
        this.cargarMateriales();
        this.cargarItems();
        this.cargarMovimientos();
      },
    },
  },
};
</script>

<style scoped>
/*
  Los colores salen de las variables del tema cuando existen (MDF) y
  caen a la paleta oscura cuando no (Falube), así el componente es el
  mismo archivo en los dos proyectos.
*/
.obra-detalle-container {
  padding: 20px;
  color: var(--color-text, #f0f0c0);
}

.obra-info { text-align: center; margin-bottom: 20px; }
.obra-info h2 { color: var(--color-accent, #f0c040); margin: 0 0 4px; }
.obra-info p { color: var(--color-text-muted, #aaa); margin: 0; }

.acciones-obra {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 14px;
}

.btn-obra {
  padding: 8px 15px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: bold;
  color: #fff;
  cursor: pointer;
  transition: filter 0.15s ease;
}
.btn-obra:hover { filter: brightness(1.12); }
.btn-obra-azul  { background-color: var(--color-blue, #3B5FCC); }
.btn-obra-verde { background-color: var(--color-green, #28a745); }
.btn-obra-rojo  { background-color: var(--color-red, #dc2626); }

.panel-dividido {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
  gap: 25px;
  align-items: start;
}

.bloque {
  background: var(--color-surface, #1a1a1a);
  border: 1px solid var(--color-surface-2, #2c2c2c);
  border-radius: 12px;
  padding: 16px;
  min-width: 0;
}

.bloque h3 {
  margin: 0 0 14px;
  color: var(--color-accent, #f0c040);
  font-size: 1.1rem;
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
.control:focus {
  outline: none;
  border-color: var(--color-accent, #f0c040);
}

.search-box { margin-bottom: 15px; }

/* FILTROS */
.filtros {
  border: 1px solid var(--color-surface-2, #2c2c2c);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 14px;
}

.filtros-grilla {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.campo { display: flex; flex-direction: column; gap: 4px; min-width: 0; }

.campo label {
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-muted, #aaa);
}

.atajos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

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
.chip:hover {
  border-color: var(--color-accent, #f0c040);
  color: var(--color-accent, #f0c040);
}
.chip-limpiar { border-color: var(--color-red, #f44336); color: var(--color-red, #f44336); }

.resumen {
  font-size: 0.85rem;
  color: var(--color-text-muted, #aaa);
  margin: 0 0 10px;
}

.error-box {
  background: rgba(244, 67, 54, 0.15);
  color: var(--color-red, #f44336);
  border-radius: 8px;
  padding: 10px;
  font-size: 0.9rem;
}

/* TABLAS */
.tabla-scroll { width: 100%; overflow-x: auto; }

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

th, td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--color-surface-2, #2c2c2c);
  vertical-align: top;
}

th {
  color: var(--color-accent, #f0c040);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

tbody tr:hover { background: var(--color-surface-2, rgba(255, 255, 255, 0.04)); }

.col-fecha { white-space: nowrap; }
.col-acciones { white-space: nowrap; }

.registro {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted, #888);
  cursor: help;
}

.unidad { color: var(--color-text-muted, #888); font-size: 0.8em; }
.muted { color: var(--color-text-muted, #888); font-size: 0.85em; }

.tag-ingreso { color: var(--color-green, #4caf50); font-weight: bold; }
.tag-salida  { color: var(--color-red, #f44336); font-weight: bold; }

.btn-chico {
  padding: 4px 8px;
  font-size: 0.78rem;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  margin-right: 4px;
}
.btn-verde { background-color: var(--color-green, #4caf50); }
.btn-rojo  { background-color: var(--color-red, #f44336); }

.btn-mas {
  width: 100%;
  margin-top: 12px;
  padding: 9px;
  border: 1px dashed var(--color-surface-2, #444);
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-muted, #bbb);
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-mas:hover:not(:disabled) { border-color: var(--color-accent, #f0c040); }
.btn-mas:disabled { opacity: 0.5; cursor: default; }

.vacio { text-align: center; color: var(--color-text-muted, #aaa); padding: 10px 0; }

@media (max-width: 1000px) {
  .panel-dividido { grid-template-columns: 1fr; }
}
</style>
