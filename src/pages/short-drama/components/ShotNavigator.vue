<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ShortDramaStoryboard } from '@/api/shortDrama/types';
import { storyboardKey, type StoryboardVersionOption } from '@/composables/useStoryboardWorkspace';
import { continuityOf } from '../shotReview';
const props = defineProps<{ shots: ShortDramaStoryboard[]; selected: string; versions: StoryboardVersionOption[]; disabled?: boolean }>();
const version = defineModel<string>('version', { required: true });
const emit = defineEmits<{ select: [id: string] }>();
const scene = ref('all');
const rows = computed(() => props.shots.map(shot => ({ shot, scene: sceneKey(continuityOf(shot)) })));
function sceneKey(c: Record<string, any>) { return c.sequence_role === 'title_prologue' ? 'prologue' : String(c.scene_number ?? '?'); }
const scenes = computed(() => [...new Set(rows.value.map(r => r.scene))]);
const visible = computed(() => rows.value.filter(r => scene.value === 'all' || r.scene === scene.value));
watch(() => props.selected, selected => {
  const row = rows.value.find(r => storyboardKey(r.shot) === selected);
  if (row && scene.value !== 'all' && row.scene !== scene.value) scene.value = 'all';
});
watch(version, () => { scene.value = 'all'; });
</script>
<template>
  <aside class="shot-nav" aria-label="分场镜头导航">
    <div class="nav-filters">
      <label v-if="versions.length > 1">分镜版本<select v-model="version" aria-label="选择分镜版本" :disabled="disabled"><option v-for="option in versions" :key="option.scriptId" :value="option.scriptId">{{ option.label }}</option></select></label>
      <label>拍摄场次<select v-model="scene" aria-label="筛选拍摄场次"><option value="all">全部场次</option><option v-for="s in scenes" :key="s" :value="s">{{ s === 'prologue' ? '独立片头' : `第 ${s} 场` }}</option></select></label>
    </div>
    <div class="nav-shots"><button v-for="{ shot, scene: shotScene } in visible" :key="storyboardKey(shot)" type="button" :class="{ selected: selected === storyboardKey(shot) }" :aria-current="selected === storyboardKey(shot) ? 'true' : undefined" @click="emit('select', storyboardKey(shot))">
      <span class="nav-meta">{{ shotScene === 'prologue' ? '片头' : shotScene === '?' ? '镜' : `场 ${shotScene} · 镜` }} {{ shot.sceneNo }} <b>预计 {{ shot.durationSeconds }} 秒</b></span>
      <strong>{{ shot.sceneTitle }}</strong><small>{{ shot.locationName }}</small>
    </button><p v-if="!visible.length" class="empty">当前筛选无镜头</p></div>
  </aside>
</template>
<style scoped>
.shot-nav { min-width: 0; contain:size; background: #f6f8fc; border: 1px solid #dce3ee; border-radius: 10px; overflow: hidden; align-self: stretch; position: sticky; top: 0; display:flex; flex-direction:column; }
.nav-filters { padding: 12px; display: grid; gap: 12px; font-size: 12px; color: #3e4c60; }.nav-filters label { display: grid; gap: 6px; }.nav-filters select { width: 100%; }.nav-filters .issues-filter { display: flex; align-items: center; }
.nav-shots { flex:1; min-height:0; overflow: auto; padding: 0 8px 8px; }.nav-shots button { display: grid; gap: 6px; text-align: left; width: 100%; background: white; color: #334155; border: 1px solid #e2e8f0; border-radius: 7px; padding: 12px; margin-bottom: 6px; cursor: pointer; }.nav-shots button.selected { border-color: #2563eb; background: #eaf2ff; box-shadow: inset 3px 0 #2563eb; }.nav-shots strong { font-size: 13px; line-height: 1.5; }.nav-meta { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }.nav-shots small { color: #64748b; font-size: 11px; line-height: 1.4; }.issue { color: #b45309; font-size: 11px; }.empty { padding: 12px; font-size: 12px; }
@media(max-width:1100px) { .shot-nav { contain:none; position:static; }.nav-filters { display:flex; flex-wrap:wrap;align-items:center;gap:12px;padding:10px; }.nav-filters label { display:flex;align-items:center;gap:8px; }.nav-filters select { width:120px; }.nav-shots { display:flex; flex:none; gap:8px;max-height:120px;overflow:auto; }.nav-shots button { flex:0 0 170px; margin:0; }.nav-shots small { display:none; } }
</style>
