<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'accent' | 'success' | 'warning'; dot?: boolean }>(), { tone: 'neutral', dot: false });
</script>

<template>
  <span class="studio-badge" :class="`tone-${tone}`"><i v-if="dot" aria-hidden="true" /><slot /></span>
</template>

<style scoped>
.studio-badge { display:inline-flex; align-items:center; gap:6px; max-width:100%; padding:4px 8px; border-radius:var(--drama-radius-sm); font-size:11px; line-height:1.4; font-weight:600; color:var(--drama-text-secondary); background:var(--drama-surface-muted); overflow-wrap:anywhere; }
.studio-badge i { width:5px; height:5px; flex:0 0 auto; border-radius:50%; background:currentColor; }
.tone-accent { color:var(--drama-primary); background:var(--drama-primary-soft); }
.tone-success { color:var(--drama-success); background:var(--drama-success-soft); }
.tone-warning { color:var(--drama-warning); background:var(--drama-warning-soft); }
</style>
