<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ continuityJson?: string }>();
const design = computed<Record<string, unknown> | null>(() => {
  try {
    const value = JSON.parse(props.continuityJson || '{}').shot_design;
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch { return null; }
});
const rows = computed(() => design.value ? [
  ['画面重点', design.value.focus], ['观众获得的信息', design.value.viewer_gain],
  ['景别与机位', design.value.framing], ['轴线与方向', design.value.axis],
  ['运镜与理由', `${design.value.movement || ''} · ${design.value.motivation || ''}`],
  ['接入动作', design.value.cut_in], ['交镜落点', design.value.cut_out],
].filter(([, value]) => typeof value === 'string' && value.trim()) : []);
</script>
<template>
  <section v-if="design" class="shot-design-card" aria-label="专业镜头设计">
    <strong>本镜重点与承接</strong>
    <dl><template v-for="[label, value] in rows" :key="String(label)"><dt>{{ label }}</dt><dd>{{ value }}</dd></template></dl>
  </section>
</template>
<style scoped>
.shot-design-card { margin:12px 0; padding:14px; border:1px solid #dbeafe; border-radius:8px; background:#f8fbff; font-size:13px; line-height:1.6; }
dl { display:grid; grid-template-columns:110px minmax(0,1fr); gap:6px 12px; margin:10px 0 0; }dt { color:#64748b; }dd { margin:0; overflow-wrap:anywhere; color:#334155; }
@media(max-width:640px) { dl { grid-template-columns:1fr; gap:4px; }dd { margin-bottom:8px; } }
</style>
