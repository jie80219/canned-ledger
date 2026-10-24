<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, PieChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{ option: echarts.EChartsCoreOption; height?: string }>()
const emit = defineEmits<{ click: [params: any] }>()
const el = ref<HTMLDivElement>()
let chart: echarts.ECharts | undefined
let ro: ResizeObserver | undefined

onMounted(() => {
  chart = echarts.init(el.value!, undefined, { renderer: 'canvas' })
  chart.setOption(props.option)
  chart.on('click', (p) => emit('click', p))
  ro = new ResizeObserver(() => chart?.resize())
  ro.observe(el.value!)
})
watch(
  () => props.option,
  (o) => chart?.setOption(o, true),
)
onUnmounted(() => {
  ro?.disconnect()
  chart?.dispose()
})
</script>

<template>
  <div ref="el" :style="{ height: height ?? '220px', width: '100%' }" />
</template>
