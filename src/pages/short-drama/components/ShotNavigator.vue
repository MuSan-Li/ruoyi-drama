<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ShortDramaStoryboard } from '@/api/shortDrama/types';
import { reviewShot } from '../shotReview';
const props = defineProps<{ shots: ShortDramaStoryboard[]; selected: number }>();
const emit = defineEmits<{ select: [sceneNo: number] }>();
const scene = ref('all');
const onlyIssues = ref(false);
const rows = computed(() => props.shots.map(shot => ({ shot, review: reviewShot(shot) })));
const scenes = computed(() => [...new Set(rows.value.map(r => String(r.review.c.scene_number || '?')))]);
const visible = computed(() => rows.value.filter(r => (scene.value === 'all' || String(r.review.c.scene_number || '?') === scene.value) && (!onlyIssues.value || r.review.issues.length)));
watch(() => props.selected, selected => {
  const row = rows.value.find(r => r.shot.sceneNo === selected);
  if (row && scene.value !== 'all' && String(row.review.c.scene_number) !== scene.value) scene.value = 'all';
  if (row && onlyIssues.value && !row.review.issues.length) onlyIssues.value = false;
});
</script>
<template>
  <aside class="shot-nav" aria-label="分场镜头导航">
    <div class="nav-filters"><label>拍摄场次<select v-model="scene" aria-label="筛选拍摄场次"><option value="all">全部场次</option><option v-for="s in scenes" :key="s" :value="s">第 {{ s }} 场</option></select></label><label class="issues-filter"><input v-model="onlyIssues" type="checkbox">只看待检查</label></div>
    <div class="nav-shots"><button v-for="{ shot, review } in visible" :key="shot.id" type="button" :class="{ selected: selected === shot.sceneNo }" :aria-current="selected === shot.sceneNo ? 'true' : undefined" @click="emit('select', shot.sceneNo)">
      <span class="nav-meta">场 {{ review.c.scene_number || '?' }} · 镜 {{ shot.sceneNo }} <b>{{ shot.durationSeconds }} 秒</b></span>
      <strong>{{ shot.sceneTitle }}</strong><small>{{ shot.locationName }}</small><span v-if="review.issues.length" class="issue">{{ review.overflow ? '内容超时' : '待检查' }}</span>
    </button><p v-if="!visible.length" class="empty">当前筛选无镜头</p></div>
  </aside>
</template>
<style scoped>
.shot-nav { min-width: 0; background: #f6f8fc; border: 1px solid #dce3ee; border-radius: 10px; overflow: hidden; align-self: start; position: sticky; top: 0; }
.nav-filters { padding: 12px; display: grid; gap: 12px; font-size: 12px; color: #3e4c60; }.nav-filters label { display: grid; gap: 6px; }.nav-filters select { width: 100%; padding: 8px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; color: #24344b; }.nav-filters .issues-filter { display: flex; align-items: center; }
.nav-shots { max-height: 60vh; overflow: auto; padding: 0 8px 8px; }.nav-shots button { display: grid; gap: 6px; text-align: left; width: 100%; background: white; color: #334155; border: 1px solid #e2e8f0; border-radius: 7px; padding: 12px; margin-bottom: 6px; cursor: pointer; }.nav-shots button.selected { border-color: #2563eb; background: #eaf2ff; box-shadow: inset 3px 0 #2563eb; }.nav-shots strong { font-size: 13px; line-height: 1.5; }.nav-meta { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }.nav-shots small { color: #64748b; font-size: 11px; line-height: 1.4; }.issue { color: #b45309; font-size: 11px; }.empty { padding: 12px; font-size: 12px; }
@media(max-width:1100px) { .shot-nav { position:static; }.nav-filters { display:flex; flex-wrap:wrap;align-items:center;gap:12px;padding:10px; }.nav-filters label { display:flex;align-items:center;gap:8px; }.nav-filters select { width:120px; }.nav-shots { display:flex; gap:8px;max-height:120px;overflow:auto; }.nav-shots button { flex:0 0 170px; margin:0; }.nav-shots small { display:none; } }
</style>
