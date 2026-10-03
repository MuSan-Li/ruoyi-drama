<script setup lang="ts">
withDefaults(defineProps<{ title: string; eyebrow?: string; description?: string; compact?: boolean }>(), { eyebrow: '', description: '', compact: false });
</script>

<template>
  <header class="studio-section" :class="{ compact }">
    <div class="section-copy"><span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span><h2>{{ title }}</h2><p v-if="description">{{ description }}</p><slot name="meta" /></div>
    <div v-if="$slots.actions" class="section-actions"><slot name="actions" /></div>
  </header>
</template>

<style scoped>
.studio-section { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; min-width:0; }
.section-copy { min-width:0; flex:1 1 240px; }
.eyebrow { display:block; margin-bottom:6px; font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--drama-primary); }
h2 { margin:0; font-size:22px; line-height:1.4; font-weight:700; letter-spacing:-.03em; color:var(--drama-text); }
p { max-width:720px; margin:6px 0 0; color:var(--drama-text-secondary); font-size:13px; line-height:1.7; }
.section-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; max-width:100%; }
.compact h2 { font-size:16px; letter-spacing:0; }.compact .eyebrow { font-size:9px; }
@media(max-width:640px) { .section-copy { flex-basis:100%; } h2 { font-size:20px; } }
</style>
