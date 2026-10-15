<template>
  <div>
    <p v-if="mensaje" class="ok-box">{{ mensaje }}</p>
    <p v-if="error" class="error-box">{{ error }}</p>

    <!-- MÁQUINAS (una por una) -->
    <div class="bloque">
      <div class="bloque-titulo">
        <h3>🚜 Máquinas <span class="muted">({{ maquinas.length }})</span></h3>
        <button v-if="puedeCargar" class="btn btn-verde" @click="abrir('alta-maquina')">
          ➕ Agregar máquina
        </button>
      </div>

      <p v-if="cargando" class="vacio">Cargando…</p>
      <div v-else-if="maquinas.length" class="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Máquina</th>
              <th>Marca / modelo</th>
              <th>Estado</th>
              <th v-if="puedeCargar">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in maquinas" :key="m.id">
              <td>
                <button class="link codigo-maq" @click="verMaquina(m)">{{ m.codigo }}</button>
              </td>
              <td>{{ m.nombre }}</td>
              <td>
                {{ [m.marca, m.modelo].filter(Boolean).join(" ") || "—" }}
                <span v-if="m.numeroSerie" class="muted"><br />N° serie {{ m.numeroSerie }}</span>
              </td>
              <td><span :class="['tag', estado(m).clase]">{{ estado(m).texto }}</span></td>
              <td v-if="puedeCargar" class="col-acciones">
                <template v-if="m.estado === 'en_uso'">
                  <button class="btn-chico btn-azul" @click="abrir('traslado-maquina', m)">Trasladar</button>
                  <button class="btn-chico btn-amarillo" @click="abrir('reparacion-maquina', m)">A reparación</button>
                </template>
                <button v-if="m.estado === 'en_reparacion'" class="btn-chico btn-verde" @click="abrir('vuelta-maquina', m)">
                  Volvió
                </button>
                <button class="btn-chico btn-rojo" @click="abrir('baja-maquina', m)">Baja</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="vacio">No hay máquinas en esta obra.</p>
    </div>

    <!-- HERRAMIENTAS (por cantidad) -->
    <div class="bloque">
      <div class="bloque-titulo">
        <h3>🛠 Herramientas <span class="muted">({{ herramientas.length }})</span></h3>
        <button v-if="puedeCargar" class="btn btn-verde" @click="abrir('alta-herramienta')">
          ➕ Agregar herramientas
        </button>
      </div>

      <p v-if="cargando" class="vacio">Cargando…</p>
      <div v-else-if="herramientas.length" class="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>Herramienta</th>
              <th class="num">Cantidad</th>
              <th v-if="puedeCargar">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in herramientas" :key="h.id">
              <td>{{ h.nombre }}</td>
              <td class="num">{{ h.cantidad }} <span class="unidad">{{ h.unidad }}</span></td>
              <td v-if="puedeCargar" class="col-acciones">
                <button class="btn-chico btn-verde" @click="abrir('alta-herramienta', h)">Agregar</button>
                <button class="btn-chico btn-azul" @click="abrir('traslado-herramienta', h)">Trasladar</button>
                <button class="btn-chico btn-rojo" @click="abrir('baja-herramienta', h)">Baja</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="vacio">No hay herramientas en esta obra.</p>
    </div>

    <!-- HISTORIAL DE HERRAMIENTAS -->
    <div class="bloque">
      <h3>Movimientos de herramientas</h3>
      <div v-if="movimientos.length" class="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Herramienta</th>
              <th>Movimiento</th>
              <th class="num">Cant.</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mov in movimientos" :key="mov.id">
              <td class="nowrap">{{ formatFecha(mov.fechaMovimiento || mov.createdAt) }}</td>
              <td>{{ mov.Material?.nombre }}</td>
              <td>
                <span :class="['tag', textoMovimiento(mov).clase]">{{ textoMovimiento(mov).texto }}</span>
              </td>
              <td class="num">{{ mov.cantidad }}</td>
              <td>{{ mov.observaciones }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="vacio">Todavía no hay movimientos de herramientas.</p>
      <p v-if="totalMovimientos > movimientos.length" class="muted">
        Mostrando los últimos {{ movimientos.length }} de {{ totalMovimientos }}.
      </p>
      <p class="muted">
        Las máquinas tienen su historial propio: tocá el código para verlo.
      </p>
    </div>

    <!-- MODAL -->
    <div v-if="modal" class="modal-fondo" @click.self="cerrar">
      <form class="modal" @submit.prevent="guardar">
        <h3>{{ tituloModal }}</h3>
        <p class="subtitulo">{{ subtituloModal }}</p>
        <p v-if="errorModal" class="error-box">{{ errorModal }}</p>

        <!-- Elegir o crear herramienta (alta sin herramienta elegida) -->
        <template v-if="modal.tipo === 'alta-herramienta' && !modal.herramienta">
          <div class="campo">
            <label>Herramienta</label>
            <input v-model="buscar" class="control" placeholder="Escribí para buscar (pala, balde, nivel…)" />
            <ul v-if="buscar && opcionesHerramienta.length" class="opciones">
              <li v-for="h in opcionesHerramienta" :key="h.id" @click="elegirHerramienta(h)">{{ h.nombre }}</li>
            </ul>
            <div v-if="buscar.trim().length >= 3 && !coincideExacta" class="aviso-box" style="margin-top: 8px">
              ¿No está en la lista?
              <button type="button" class="link" @click="crearHerramienta(false)" :disabled="guardando">
                Crear la herramienta "{{ buscar.trim() }}"
              </button>
              <template v-if="parecidosNueva.length">
                <br />Ojo, hay parecidas:
                <span v-for="p in parecidosNueva" :key="p.id">
                  <button type="button" class="link" @click="elegirHerramienta(p)">{{ p.nombre }}</button>&nbsp;
                </span>
                <br />
                <button type="button" class="link" @click="crearHerramienta(true)">Es otra, crearla igual</button>
              </template>
            </div>
          </div>
        </template>

        <!-- Cantidad (herramientas) -->
        <div v-if="esHerramienta && (modal.herramienta || modal.tipo !== 'alta-herramienta')" class="campo">
          <label>Cantidad</label>
          <input v-model.number="form.cantidad" type="number" min="1" :max="maxCantidad || null" step="1" class="control" required />
          <span v-if="maxCantidad" class="ayuda">Hay {{ maxCantidad }} en esta obra.</span>
        </div>

        <!-- Datos de máquina nueva -->
        <template v-if="modal.tipo === 'alta-maquina'">
          <div class="campo">
            <label>Qué máquina es</label>
            <input v-model="form.nombre" class="control" placeholder="Ej.: Hormigonera 400 L" required />
          </div>
          <div class="fila-campos">
            <div class="campo">
              <label>Marca</label>
              <input v-model="form.marca" class="control" />
            </div>
            <div class="campo">
              <label>Modelo</label>
              <input v-model="form.modelo" class="control" />
            </div>
          </div>
          <div class="fila-campos">
            <div class="campo">
              <label>Código interno</label>
              <input v-model="form.codigo" class="control" required />
              <span class="ayuda">El número que se le pinta a la máquina.</span>
            </div>
            <div class="campo">
              <label>N° de serie</label>
              <input v-model="form.numeroSerie" class="control" />
            </div>
          </div>
        </template>

        <!-- Obra de destino -->
        <div v-if="['traslado-herramienta', 'traslado-maquina', 'vuelta-maquina'].includes(modal.tipo)" class="campo">
          <label>{{ modal.tipo === 'vuelta-maquina' ? 'Vuelve a la obra' : 'Obra de destino' }}</label>
          <select v-model="form.obraDestinoId" class="control" required>
            <option value="" disabled>Elegí la obra</option>
            <option v-for="o in obrasDestino" :key="o.id" :value="o.id">{{ o.nombre }}</option>
          </select>
        </div>

        <!-- Motivo de baja -->
        <div v-if="['baja-herramienta', 'baja-maquina'].includes(modal.tipo)" class="campo">
          <label>Motivo</label>
          <select v-model="form.motivo" class="control" required>
            <option value="" disabled>Elegí el motivo</option>
            <option v-for="m in motivos" :key="m.valor" :value="m.valor">{{ m.texto }}</option>
          </select>
        </div>

        <div class="campo">
          <label>Fecha</label>
          <input v-model="form.fecha" type="date" :max="hoy" class="control" required />
        </div>

        <div class="campo">
          <label>Observaciones</label>
          <input v-model="form.observaciones" class="control" maxlength="255"
            :placeholder="modal.tipo === 'reparacion-maquina' ? 'Qué tiene, a qué taller fue…' : ''" />
        </div>

        <div class="modal-acciones">
          <button type="button" class="btn btn-gris" @click="cerrar">Cancelar</button>
          <button type="submit" :class="['btn', modal.tipo.startsWith('baja') ? 'btn-rojo' : 'btn-azul']"
            :disabled="guardando || (modal.tipo === 'alta-herramienta' && !modal.herramienta)">
            {{ guardando ? "Guardando…" : "Guardar" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import { useAuthStore } from "../stores/authStore";
import {
  hoyLocal, formatFecha, ESTADOS_MAQUINA, MOTIVOS_BAJA,
  textoMovimientoHerramienta, mensajeError,
} from "../utils/formato.js";

const TITULOS = {
  "alta-herramienta": "Agregar herramientas",
  "traslado-herramienta": "Trasladar herramientas",
  "baja-herramienta": "Dar de baja herramientas",
  "alta-maquina": "Agregar máquina",
  "traslado-maquina": "Trasladar máquina",
  "reparacion-maquina": "Enviar a reparación",
  "vuelta-maquina": "Volvió de reparación",
  "baja-maquina": "Dar de baja la máquina",
};

export default {
  name: "HerramientasObra",
  props: {
    obraId: { type: [String, Number], required: true },
    obraNombre: { type: String, default: "" },
  },
  emits: ["cambio"],

  setup() {
    return { authStore: useAuthStore() };
  },

  data() {
    return {
      maquinas: [],
      herramientas: [],
      movimientos: [],
      totalMovimientos: 0,
      obras: [],
      catalogo: [],
      cargando: false,
      mensaje: "",
      error: "",
      modal: null,
      form: {},
      buscar: "",
      parecidosNueva: [],
      errorModal: "",
      guardando: false,
      hoy: hoyLocal(),
      motivos: MOTIVOS_BAJA,
    };
  },

  computed: {
    puedeCargar() {
      return this.authStore.canModify;
    },
    esHerramienta() {
      return this.modal?.tipo.endsWith("-herramienta");
    },
    maxCantidad() {
      return ["traslado-herramienta", "baja-herramienta"].includes(this.modal?.tipo)
        ? this.modal.herramienta?.cantidad
        : null;
    },
    obrasDestino() {
      // A una máquina que vuelve de reparación se la puede traer a esta misma obra.
      if (this.modal?.tipo === "vuelta-maquina") return this.obras;
      return this.obras.filter((o) => String(o.id) !== String(this.obraId));
    },
    opcionesHerramienta() {
      const t = this.buscar.trim().toLowerCase();
      if (!t) return [];
      return this.catalogo.filter((h) => h.nombre.toLowerCase().includes(t)).slice(0, 30);
    },
    coincideExacta() {
      const t = this.buscar.trim().toLowerCase();
      return this.catalogo.some((h) => h.nombre.trim().toLowerCase() === t);
    },
    tituloModal() {
      return TITULOS[this.modal?.tipo] || "";
    },
    subtituloModal() {
      const m = this.modal;
      if (!m) return "";
      if (m.maquina) return `${m.maquina.codigo} · ${m.maquina.nombre}`;
      if (m.herramienta) return `${m.herramienta.nombre} · ${this.obraNombre}`;
      return this.obraNombre;
    },
  },

  watch: {
    obraId: {
      immediate: true,
      handler() {
        this.mensaje = "";
        this.error = "";
        this.cargarTodo();
      },
    },
    buscar() {
      this.parecidosNueva = [];
    },
  },

  created() {
    this.cargarObras();
  },

  methods: {
    formatFecha,
    textoMovimiento: textoMovimientoHerramienta,

    estado(m) {
      return ESTADOS_MAQUINA[m.estado] || { texto: m.estado, clase: "tag-gris" };
    },

    async cargarTodo() {
      this.cargando = true;
      const pedidoPara = String(this.obraId);
      try {
        const [maq, herr, movs] = await Promise.all([
          api.get("/maquinas", { params: { obraId: pedidoPara } }),
          api.get(`/obras/${pedidoPara}/herramientas`),
          api.get(`/obras/${pedidoPara}/herramientas/movimientos`, { params: { limit: 50 } }),
        ]);
        if (pedidoPara !== String(this.obraId)) return;
        this.maquinas = maq.data;
        this.herramientas = herr.data;
        this.movimientos = movs.data.movimientos || [];
        this.totalMovimientos = movs.data.total || 0;
      } catch (err) {
        if (pedidoPara !== String(this.obraId)) return;
        this.error = mensajeError(err, "No se pudieron cargar las herramientas");
      } finally {
        if (pedidoPara === String(this.obraId)) this.cargando = false;
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

    async cargarCatalogo() {
      const res = await api.get("/materiales", { params: { clase: "herramienta" } });
      this.catalogo = res.data;
    },

    async abrir(tipo, item = null) {
      this.mensaje = "";
      this.errorModal = "";
      this.buscar = "";
      this.parecidosNueva = [];
      const esMaquina = tipo.endsWith("-maquina");

      this.modal = {
        tipo,
        maquina: esMaquina ? item : null,
        herramienta: !esMaquina ? item : null,
      };
      this.form = {
        cantidad: 1,
        fecha: hoyLocal(),
        observaciones: "",
        obraDestinoId: tipo === "vuelta-maquina" ? Number(this.obraId) : "",
        motivo: "",
        nombre: "",
        marca: "",
        modelo: "",
        numeroSerie: "",
        codigo: "",
      };
      this.hoy = hoyLocal();

      try {
        if (tipo === "alta-herramienta" && !item) await this.cargarCatalogo();
        if (tipo === "alta-maquina") {
          const res = await api.get("/maquinas/codigo-siguiente");
          this.form.codigo = res.data.codigo;
        }
      } catch (err) {
        this.errorModal = mensajeError(err, "No se pudo preparar el formulario");
      }
    },

    cerrar() {
      if (this.guardando) return;
      this.modal = null;
    },

    elegirHerramienta(h) {
      this.modal.herramienta = h;
      this.buscar = "";
    },

    // Crea una herramienta nueva en el catálogo. Si el servidor avisa que
    // hay parecidas, se muestran para elegir una de esas o confirmar.
    async crearHerramienta(confirmar) {
      this.errorModal = "";
      this.guardando = true;
      try {
        const res = await api.post("/materiales", {
          nombre: this.buscar.trim(),
          unidad: "unidad",
          clase: "herramienta",
          confirmarParecido: confirmar,
        });
        this.catalogo.push(res.data);
        this.elegirHerramienta(res.data);
      } catch (err) {
        const datos = err.response?.data;
        if (err.response?.status === 409 && datos?.parecidos) {
          if (datos.bloqueado) {
            this.errorModal = datos.message;
            this.parecidosNueva = datos.parecidos;
          } else {
            this.parecidosNueva = datos.parecidos;
          }
        } else {
          this.errorModal = mensajeError(err, "No se pudo crear la herramienta");
        }
      } finally {
        this.guardando = false;
      }
    },

    async guardar() {
      if (this.guardando) return;
      this.errorModal = "";
      this.guardando = true;

      const { tipo, maquina, herramienta } = this.modal;
      const f = this.form;
      const base = { fecha: f.fecha, observaciones: f.observaciones };
      const obra = `/obras/${this.obraId}/herramientas`;

      try {
        let res;
        switch (tipo) {
          case "alta-herramienta":
            res = await api.post(`${obra}/alta`, { ...base, materialId: herramienta.id, cantidad: f.cantidad });
            break;
          case "traslado-herramienta":
            res = await api.post(`${obra}/traslado`, {
              ...base, materialId: herramienta.id, cantidad: f.cantidad, obraDestinoId: f.obraDestinoId,
            });
            break;
          case "baja-herramienta":
            res = await api.post(`${obra}/baja`, {
              ...base, materialId: herramienta.id, cantidad: f.cantidad, motivo: f.motivo,
            });
            break;
          case "alta-maquina":
            res = await api.post("/maquinas", {
              ...base, obraId: this.obraId, nombre: f.nombre, marca: f.marca,
              modelo: f.modelo, numeroSerie: f.numeroSerie, codigo: f.codigo,
            });
            break;
          case "traslado-maquina":
            res = await api.post(`/maquinas/${maquina.id}/traslado`, { ...base, obraDestinoId: f.obraDestinoId });
            break;
          case "reparacion-maquina":
            res = await api.post(`/maquinas/${maquina.id}/reparacion`, base);
            break;
          case "vuelta-maquina":
            res = await api.post(`/maquinas/${maquina.id}/vuelta`, { ...base, obraDestinoId: f.obraDestinoId });
            break;
          case "baja-maquina":
            res = await api.post(`/maquinas/${maquina.id}/baja`, { ...base, motivo: f.motivo });
            break;
        }

        this.mensaje =
          res?.data?.message ||
          (tipo === "alta-maquina" ? `Máquina ${res.data.codigo} agregada` : "Guardado");
        this.modal = null;
        await this.cargarTodo();
        this.$emit("cambio");
      } catch (err) {
        this.errorModal = mensajeError(err);
      } finally {
        this.guardando = false;
      }
    },

    verMaquina(m) {
      this.$router.push({ name: "MaquinaDetalle", params: { id: m.id } });
    },
  },
};
</script>

<style scoped src="../assets/css/gestion.css"></style>
