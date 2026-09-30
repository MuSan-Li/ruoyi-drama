<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ modelValue: number; total: number; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const batches = computed(() => Array.from({ length: Math.ceil(props.total / 10) }, (_, i) => ({
  start: i * 10 + 1, end: Math.min(i * 10 + 10, props.total)
})));
</script>
<template>
  <select aria-label="生成镜号范围" :value="modelValue" :disabled="disabled" @change="emit('update:modelValue', Number(($event.target as HTMLSelectElement).value))">
    <option v-for="batch in batches" :key="batch.start" :value="batch.start">第 {{ batch.start }}—{{ batch.end }} 镜</option>
  </select>
</template>
<style scoped>
select { max-width:100%; padding:7px 10px; border:1px solid #d4dfed; border-radius:6px; background:white; color:#334155; font:inherit; font-size:13px; }
</style>
