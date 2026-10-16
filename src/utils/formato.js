// src/utils/formato.js
// Formatos y etiquetas compartidos por herramientas, máquinas y catálogo.

// Fecha local en AAAA-MM-DD (sin pasar por UTC, que nos correría un día).
export function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// "AAAA-MM-DD" -> "DD/MM/AAAA" sin construir un Date (que lo tomaría como UTC).
export function formatFecha(valor) {
  if (!valor) return "—";
  const [anio, mes, dia] = String(valor).slice(0, 10).split("-");
  if (!anio || !mes || !dia) return String(valor);
  return `${dia}/${mes}/${anio}`;
}

// Misma lista que el backend (lib/unidades.js). Se usa si el servidor no la
// devuelve, para que nunca quede el formulario sin unidades para elegir.
export const UNIDADES = [
  "unidad", "bolsa", "kg", "g", "m", "m2", "m3", "litro", "barra", "rollo",
  "palet", "hoja", "pliego", "paquete", "caja", "par", "juego",
];

export const ESTADOS_MAQUINA = {
  en_uso: { texto: "En uso", clase: "tag-verde" },
  en_reparacion: { texto: "En reparación", clase: "tag-amarillo" },
  baja: { texto: "De baja", clase: "tag-gris" },
};

export const MOTIVOS_BAJA = [
  { valor: "rota", texto: "Rota" },
  { valor: "perdida", texto: "Perdida" },
  { valor: "robada", texto: "Robada" },
  { valor: "otro", texto: "Otro" },
];

export function textoMotivo(valor) {
  return MOTIVOS_BAJA.find((m) => m.valor === valor)?.texto || valor || "";
}

// Movimientos de herramientas por cantidad.
export function textoMovimientoHerramienta(mov) {
  const otra = mov.ObraRelacionada?.nombre;
  switch (mov.tipo) {
    case "ingreso": return { texto: "Alta", clase: "tag-verde" };
    case "traslado_salida": return { texto: `Trasladada a ${otra || "otra obra"}`, clase: "tag-azul" };
    case "traslado_ingreso": return { texto: `Llegó de ${otra || "otra obra"}`, clase: "tag-azul" };
    case "baja": return { texto: `Baja (${textoMotivo(mov.motivo)})`, clase: "tag-rojo" };
    case "salida": return { texto: "Salida (carga vieja)", clase: "tag-gris" };
    default: return { texto: mov.tipo, clase: "tag-gris" };
  }
}

// Historial de una máquina.
export function textoMovimientoMaquina(mov) {
  const origen = mov.ObraOrigen?.nombre;
  const destino = mov.ObraDestino?.nombre;
  switch (mov.tipo) {
    case "alta": return { texto: `Alta en ${destino || "—"}`, clase: "tag-verde" };
    case "traslado": return { texto: `${origen || "—"} → ${destino || "—"}`, clase: "tag-azul" };
    case "reparacion": return { texto: `A reparación (desde ${origen || "—"})`, clase: "tag-amarillo" };
    case "vuelta": return { texto: `Volvió de reparación a ${destino || "—"}`, clase: "tag-verde" };
    case "baja": return { texto: `Baja: ${textoMotivo(mov.motivo)}`, clase: "tag-rojo" };
    default: return { texto: mov.tipo, clase: "tag-gris" };
  }
}

export function mensajeError(err, porDefecto = "No se pudo guardar") {
  return err?.response?.data?.message || err?.response?.data?.error || porDefecto;
}
