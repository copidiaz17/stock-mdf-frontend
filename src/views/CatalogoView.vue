<template>
  <div class="gestion">
    <div class="encabezado">
      <div>
        <h2>📚 Catálogo de materiales</h2>
        <p class="subtitulo">Unificar repetidos, separar herramientas y máquinas, y corregir unidades.</p>
      </div>
    </div>

    <div class="pestanas">
      <button :class="['pestana', { activa: pestana === 'unificar' }]" @click="pestana = 'unificar'">
        Unificar repetidos <span class="contador">{{ grupos.length }}</span>
      </button>
      <button :class="['pestana', { activa: pestana === 'clasificar' }]" @click="pestana = 'clasificar'">
        Herramientas y máquinas <span class="contador">{{ sugeridosVisibles.length }}</span>
      </button>
      <button :class="['pestana', { activa: pestana === 'unidades' }]" @click="pestana = 'unidades'">
        Unidades a revisar <span class="contador">{{ sinUnidad.length }}</span>
      </button>
    </div>

    <p v-if="mensaje" class="ok-box">{{ mensaje }}</p>
    <p v-if="error" class="error-box">{{ error }}</p>
    <p v-if="cargando" class="vacio">Cargando…</p>

    <!-- ============ UNIFICAR ============ -->
    <template v-if="pestana === 'unificar' && !cargando">
      <div class="bloque">
        <div class="bloque-titulo">
          <h3>Unificar a mano</h3>
        </div>
        <p class="muted">
          Para los que el sistema no detecta solo (p. ej. "hierro del 8" y "HIERRO 8X12 METROS").
          Buscá, tildá los que son lo mismo y elegí cuál queda.
        </p>
        <div class="campo">
          <input v-model="buscarManual" class="control" placeholder="Buscar en el catálogo (mínimo 3 letras)…" />
        </div>
        <div v-if="resultadosManual.length" class="tabla-scroll">
          <table>
            <thead>
              <tr><th></th><th>Material</th><th>Unidad</th><th class="num">Movim.</th><th class="num">Stock</th></tr>
            </thead>
            <tbody>
              <tr v-for="m in resultadosManual" :key="m.id">
                <td><input type="checkbox" :checked="manual.has(m.id)" @change="alternarManual(m)" /></td>
                <td>{{ m.nombre }} <span v-if="m.clase === 'herramienta'" class="tag tag-azul">herramienta</span></td>
                <td class="unidad">{{ m.unidad || "—" }}</td>
                <td class="num">{{ m.movimientos }}</td>
                <td class="num">{{ m.stock }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="grupoManual" class="tarjeta-grupo">
          <p><b>{{ grupoManual.miembros.length + 1 }} elegidos.</b> Elegí cuál queda:</p>
          <GrupoUnificar :grupo="grupoManual" :unidades="unidades" :guardando="guardando"
            @unificar="unificar" />
        </div>
      </div>

      <div class="bloque">
        <h3>Sugeridos por el sistema</h3>
        <p class="muted">
          ✔ = mismo nombre escrito distinto (vienen tildados). ≈ = parecido: tildalo solo si es lo mismo.
          El que queda se lleva todos los movimientos y el stock de los otros, en todas las obras.
        </p>
        <div v-for="g in grupos" :key="g.principal.id" class="tarjeta-grupo">
          <GrupoUnificar :grupo="g" :unidades="unidades" :guardando="guardando" @unificar="unificar" />
        </div>
        <p v-if="!grupos.length" class="vacio">No quedan repetidos sugeridos. 🎉</p>
      </div>
    </template>

    <!-- ============ CLASIFICAR ============ -->
    <template v-if="pestana === 'clasificar' && !cargando">
      <div class="bloque">
        <p class="muted">
          Están cargados como material pero por el nombre parecen herramientas o máquinas.<br />
          <b>Herramienta</b>: se cuenta por cantidad (palas, baldes…).
          <b>Máquinas con número</b>: se crea una ficha por cada una, en la obra donde está (MAQ-001, MAQ-002…).
        </p>
        <div class="campo">
          <input v-model="buscarClasificar" class="control" placeholder="Filtrar, o buscar cualquier otro material del catálogo…" />
        </div>
        <div v-if="listaClasificar.length" class="tabla-scroll">
          <table>
            <thead>
              <tr><th>Material</th><th>Dónde hay</th><th>Sugerido</th><th>Pasar a</th></tr>
            </thead>
            <tbody>
              <tr v-for="m in listaClasificar" :key="m.id">
                <td>
                  {{ m.nombre }}
                  <span class="muted"><br />{{ m.movimientos }} movimientos</span>
                </td>
                <td>
                  <span v-if="!m.enObras?.length && !m.stock" class="muted">sin stock</span>
                  <span v-for="o in m.enObras || []" :key="o.obra" class="nowrap">{{ o.cantidad }} en {{ o.obra }}<br /></span>
                  <span v-if="!m.enObras && m.stock" class="muted">{{ m.stock }} en {{ m.obrasConStock }} obra(s)</span>
                </td>
                <td>
                  <span v-if="m.sugerida" :class="['tag', m.sugerida === 'maquina' ? 'tag-amarillo' : 'tag-azul']">
                    {{ m.sugerida === 'maquina' ? 'máquina' : 'herramienta' }}
                  </span>
                </td>
                <td class="col-acciones">
                  <button class="btn-chico btn-azul" :disabled="guardando" @click="aHerramienta(m)">Herramienta</button>
                  <button class="btn-chico btn-amarillo" :disabled="guardando" @click="aMaquinas(m)">
                    Máquinas con número<span v-if="m.stock"> ({{ m.stock }})</span>
                  </button>
                  <button v-if="m.sugerida" class="btn-chico btn-gris" :disabled="guardando" @click="esMaterial(m)">Es material</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="vacio">No hay nada para clasificar.</p>
      </div>
    </template>

    <!-- ============ UNIDADES ============ -->
    <template v-if="pestana === 'unidades' && !cargando">
      <div class="bloque">
        <p class="muted">
          Estos tienen una unidad que no se entiende (vacía, un número como "200", "10m"…).
          Elegí la correcta de la lista.
        </p>
        <div v-if="sinUnidad.length" class="tabla-scroll">
          <table>
            <thead>
              <tr><th>Material</th><th>Unidad cargada</th><th>Unidad correcta</th><th class="num">Movim.</th></tr>
            </thead>
            <tbody>
              <tr v-for="m in sinUnidad" :key="m.id">
                <td>{{ m.nombre }}</td>
                <td class="unidad">"{{ m.unidad }}"</td>
                <td>
                  <select class="control" :disabled="guardando" @change="cambiarUnidad(m, $event.target.value)">
                    <option value="">Elegir…</option>
                    <option v-for="u in unidades" :key="u" :value="u">{{ u }}</option>
                  </select>
                </td>
                <td class="num">{{ m.movimientos }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="vacio">Todas las unidades están bien.</p>
      </div>
    </template>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";
import GrupoUnificar from "../components/GrupoUnificar.vue";
import { mensajeError } from "../utils/formato.js";

// Para el filtro de texto: sin mayúsculas ni acentos.
function plano(t) {
  return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default {
  name: "CatalogoView",
  components: { GrupoUnificar },

  data() {
    return {
      pestana: "unificar",
      catalogo: [],
      grupos: [],
      sugeridos: [],
      descartados: new Set(),
      unidades: [],
      cargando: false,
      guardando: false,
      mensaje: "",
      error: "",
      buscarManual: "",
      manual: new Map(),
      buscarClasificar: "",
    };
  },

  computed: {
    sinUnidad() {
      return this.catalogo.filter((m) => !m.unidadValida).sort((a, b) => b.movimientos - a.movimientos);
    },

    resultadosManual() {
      const t = plano(this.buscarManual.trim());
      if (t.length < 3) return [...this.manual.values()];
      const elegidos = [...this.manual.values()];
      const encontrados = this.catalogo.filter((m) => !this.manual.has(m.id) && plano(m.nombre).includes(t));
      return [...elegidos, ...encontrados.slice(0, 40)];
    },

    // Con 2 o más tildados se arma un grupo: queda el más usado.
    grupoManual() {
      const elegidos = [...this.manual.values()].sort((a, b) => b.movimientos - a.movimientos);
      if (elegidos.length < 2) return null;
      const [principal, ...resto] = elegidos;
      return {
        manual: true,
        principal,
        miembros: resto.map((m) => ({ ...m, nivel: "igual" })),
      };
    },

    sugeridosVisibles() {
      return this.sugeridos.filter((m) => !this.descartados.has(m.id));
    },

    // Los sugeridos, más cualquier material del catálogo que coincida con la búsqueda.
    listaClasificar() {
      const t = plano(this.buscarClasificar.trim());
      if (!t) return this.sugeridosVisibles;
      const sugeridosQueCoinciden = this.sugeridosVisibles.filter((m) => plano(m.nombre).includes(t));
      if (t.length < 3) return sugeridosQueCoinciden;
      const ids = new Set(sugeridosQueCoinciden.map((m) => m.id));
      const otros = this.catalogo
        .filter((m) => m.clase === "material" && !ids.has(m.id) && plano(m.nombre).includes(t))
        .slice(0, 30);
      return [...sugeridosQueCoinciden, ...otros];
    },
  },

  methods: {
    async cargar() {
      this.cargando = true;
      this.error = "";
      try {
        const [cat, grupos, sug, unidades] = await Promise.all([
          api.get("/catalogo/materiales"),
          api.get("/catalogo/sugerencias/unificar"),
          api.get("/catalogo/sugerencias/clasificar"),
          api.get("/materiales/unidades"),
        ]);
        this.catalogo = cat.data;
        this.grupos = grupos.data;
        this.sugeridos = sug.data;
        this.unidades = unidades.data;
      } catch (err) {
        this.error = mensajeError(err, "No se pudo cargar el catálogo");
      } finally {
        this.cargando = false;
      }
    },

    alternarManual(m) {
      const nuevo = new Map(this.manual);
      if (nuevo.has(m.id)) nuevo.delete(m.id);
      else nuevo.set(m.id, m);
      this.manual = nuevo;
    },

    async unificar({ principalId, duplicadosIds, nombre, unidad, resumen }) {
      if (this.guardando) return;
      if (!confirm(`${resumen}\n\nEsto no se puede deshacer desde el sistema. ¿Unificar?`)) return;

      this.guardando = true;
      this.error = "";
      this.mensaje = "";
      try {
        const res = await api.post("/catalogo/unificar", { principalId, duplicadosIds, nombre, unidad });
        const r = res.data;
        this.mensaje = `Listo: ${r.unificados} unificado(s) en "${nombre}". Se pasaron ${r.movimientos} movimientos (${r.obras} obra(s) con stock).`;
        this.manual = new Map();
        this.buscarManual = "";
        await this.cargar();
      } catch (err) {
        this.error = mensajeError(err, "No se pudo unificar");
      } finally {
        this.guardando = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    async aHerramienta(m) {
      await this.guardarCambio(m, { clase: "herramienta" }, `"${m.nombre}" ahora es herramienta (se cuenta por cantidad).`);
    },

    esMaterial(m) {
      // No cambia nada en la base: solo lo saca de la lista de sugeridos.
      this.descartados = new Set([...this.descartados, m.id]);
    },

    async aMaquinas(m) {
      if (this.guardando) return;
      const cuantas = m.stock || 0;
      const texto = cuantas
        ? `Se van a crear ${cuantas} máquina(s) "${m.nombre}", cada una con su código, en la obra donde está.`
        : `"${m.nombre}" no tiene stock: no se crea ninguna máquina, solo deja de aparecer como material. Las máquinas se agregan después desde la obra.`;
      if (!confirm(`${texto}\n\n¿Seguir?`)) return;

      this.guardando = true;
      this.error = "";
      this.mensaje = "";
      try {
        const res = await api.post(`/catalogo/materiales/${m.id}/maquinas`);
        const creadas = res.data.creadas || [];
        this.mensaje = creadas.length
          ? `Se crearon ${creadas.length} máquina(s): ${creadas.map((c) => `${c.codigo} (${c.obra})`).join(", ")}.`
          : `"${m.nombre}" ya no aparece como material.`;
        await this.cargar();
      } catch (err) {
        this.error = mensajeError(err, "No se pudo convertir");
      } finally {
        this.guardando = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    async cambiarUnidad(m, unidad) {
      if (!unidad) return;
      await this.guardarCambio(m, { unidad }, `"${m.nombre}": unidad "${unidad}".`);
    },

    async guardarCambio(m, cambios, textoOk) {
      if (this.guardando) return;
      this.guardando = true;
      this.error = "";
      this.mensaje = "";
      try {
        await api.put(`/catalogo/materiales/${m.id}`, cambios);
        this.mensaje = textoOk;
        await this.cargar();
      } catch (err) {
        this.error = mensajeError(err);
      } finally {
        this.guardando = false;
      }
    },
  },

  created() {
    this.cargar();
  },
};
</script>

<style scoped src="../assets/css/gestion.css"></style>
<style scoped>
.tarjeta-grupo {
  border: 1px solid var(--color-surface-2, #2c2c2c);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}
</style>
