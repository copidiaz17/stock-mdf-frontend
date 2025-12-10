<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Historial de Movimientos</h1>

    <table class="w-full border">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-3 py-2">Fecha</th>
          <th class="border px-3 py-2">Material</th>
          <th class="border px-3 py-2">Tipo</th>
          <th class="border px-3 py-2">Cantidad</th>
          <th class="border px-3 py-2">Observaciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in movimientos" :key="m.id">
          <td class="border px-3 py-2">{{ new Date(m.createdAt).toLocaleString() }}</td>
          <td class="border px-3 py-2">{{ m.Material.nombre }}</td>
          <td class="border px-3 py-2">
            <span :class="m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'">
              {{ m.tipo }}
            </span>
          </td>
          <td class="border px-3 py-2">{{ m.cantidad }}</td>
          <td class="border px-3 py-2">{{ m.observaciones }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import api from "../config/axios.Config.js";

export default {
  data() {
    return {
      movimientos: []
    };
  },
  async mounted() {
    const obraId = this.$route.params.obraId;

    const res = await api.get(`/obras/${obraId}/movimientos`);
    this.movimientos = res.data;
  }
};
</script>
