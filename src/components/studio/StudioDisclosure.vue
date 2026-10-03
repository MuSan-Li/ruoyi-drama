<script setup lang="ts">
import { ref } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';
const props = withDefaults(defineProps<{ title: string; description?: string; defaultOpen?: boolean }>(), { description: '', defaultOpen: false });
const open = ref(props.defaultOpen);
function toggle(event: Event) { open.value = (event.target as HTMLDetailsElement).open; }
</script>

<template>
  <details class="studio-disclosure" :open="open" @toggle="toggle">
    <summary><el-icon class="disclosure-arrow"><ArrowRight /></el-icon><span class="disclosure-title">{{ title }}</span><span v-if="description" class="disclosure-description">{{ description }}</span><slot name="status" /></summary>
    <div class="disclosure-content"><slot /></div>
  </details>
</template>

<style scoped>
.studio-disclosure { min-width:0; border:1px solid var(--drama-border); border-radius:var(--drama-radius-md); background:var(--drama-surface-strong); }
summary { display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding:13px 16px; cursor:pointer; list-style:none; user-select:none; }
summary::-webkit-details-marker { display:none; }.disclosure-arrow { color:var(--drama-text-tertiary); transition:transform .15s; }[open] .disclosure-arrow { transform:rotate(90deg); }
.disclosure-title { font-size:13px; font-weight:650; color:var(--drama-text); }.disclosure-description { margin-left:auto; color:var(--drama-text-tertiary); font-size:11px; }
.disclosure-content { padding:0 16px 16px; min-width:0; }[open] summary { border-bottom:1px solid var(--drama-border-subtle); margin-bottom:16px; }
</style>
