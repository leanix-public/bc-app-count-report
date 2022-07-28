<template>
  <div class="h-screen flex flex-col">
    <apexchart
      v-if="chartOptions !== null"
      class="flex justify-center flex-1"
      :options="chartOptions"
      :series="series" />
  </div>
</template>

<script lang="ts" setup>
import useReport from './composables/useReport'
const { initReport, chartOptions, series } = useReport()
initReport()

</script>
