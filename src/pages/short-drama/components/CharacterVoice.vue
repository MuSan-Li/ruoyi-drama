<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useCharacterVoice } from '@/composables/useCharacterVoice';
import type { ShortDramaCharacter } from '@/api/shortDrama/types';
const props = defineProps<{ projectId: string; character: ShortDramaCharacter }>();
const id = computed(() => String(props.character.id || ''));
const expanded = ref(false);
watch([() => props.projectId, id], () => { expanded.value = false; });
function onToggle(event: Event) { expanded.value = (event.target as HTMLDetailsElement).open; }
const { view, description, sampleText, model, models, busy, error, preview, pending, save, generate, select, upload, listen, refresh } = useCharacterVoice(toRef(props, 'projectId'), id);
const selected = computed(() => view.value?.profile.samples.find(s => s.id === view.value?.profile.selectedSampleId));
const bindingLabel = computed(() => !view.value ? (error.value ? '读取失败' : '读取中…') : selected.value ? `已绑定 · v${view.value.profile.version}` : '待选用样音');
const status: Record<string, string> = { submitting: '提交中', processing: '生成中', saving: '保存中', completed: '已保存候选', failed: '失败', submission_unknown: '提交结果未知，请核对上游任务' };
async function onFile(event: Event) { const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (file) await upload(file); input.value = ''; }
</script>

<template>
  <details class="voice-card" :open="expanded" @toggle="onToggle">
    <summary>角色声音 <span :class="{ bound: selected, pending: !view && !error }">{{ bindingLabel }}</span></summary>
    <div v-if="expanded" class="voice-form">
      <label>声音与表演描述<el-input v-model="description" type="textarea" :rows="2" maxlength="1500" placeholder="年龄、音高、气质、方言及表演方式" :aria-label="`${character.name}声音描述`" /></label>
      <label>样音正文<el-input v-model="sampleText" maxlength="80" placeholder="建议一句短台词，约2—4秒" :aria-label="`${character.name}样音正文`" /></label>
      <div class="voice-actions">
        <el-button size="small" :disabled="busy" @click="save">保存设定</el-button>
        <el-button size="small" type="primary" :loading="busy" :disabled="pending || !model || !description.trim() || !sampleText.trim()" :title="!models.length ? '请在模型配置中启用 Seed Audio 1.0' : undefined" @click="generate">生成样音</el-button>
        <label class="voice-upload">上传样音<input type="file" accept="audio/*" :disabled="busy" :aria-label="`${character.name}上传样音`" @change="onFile" /></label>
        <el-button size="small" text :disabled="busy" @click="refresh(false).catch(e => error = String(e))">刷新</el-button>
      </div>
      <div v-for="sample in view?.profile.samples" :key="sample.id" class="voice-sample">
        <div><strong>{{ sample.label }}</strong><small>{{ sample.duration.toFixed(2) }}秒 · {{ sample.source === 'generated' ? 'Seed Audio 1.0' : '上传' }}</small></div>
        <el-button size="small" @click="listen(sample.id)">试听</el-button>
        <el-button size="small" :type="sample.id === selected?.id ? 'success' : 'default'" :disabled="busy || sample.id === selected?.id" @click="select(sample.id)">{{ sample.id === selected?.id ? '已选用' : '选用此样音' }}</el-button>
      </div>
      <audio v-if="preview" :src="preview" controls autoplay />
      <div v-for="job in view?.jobs.filter(j => j.status !== 'completed')" :key="job.id" class="voice-job"><span>{{ status[job.status] || job.status }}</span><p v-if="job.error">{{ job.error }}</p></div>
      <p v-if="error" class="voice-error" role="alert">{{ error }}</p>
    </div>
  </details>
</template>

<style scoped>
.voice-card { border:1px solid var(--drama-border); border-radius:var(--drama-radius-md); background:var(--drama-surface-strong); padding:16px; }
.voice-card summary { cursor:pointer; font-size:13px; font-weight:650; display:flex; align-items:center; gap:8px; list-style:none; color:var(--drama-text); }
.voice-card summary::-webkit-details-marker { display:none; }.voice-card summary::before { content:'›'; color:var(--drama-text-tertiary); font-size:18px; line-height:1; transition:transform .15s; }.voice-card[open] summary::before { transform:rotate(90deg); }
.voice-card summary span { margin-left:auto; font-size:11px; font-weight:500; color:var(--drama-warning); padding:4px 7px; background:var(--drama-warning-soft); border-radius:5px; }.voice-card summary .bound { color:var(--drama-success); background:var(--drama-success-soft); }
.voice-card summary .pending { color:var(--drama-text-tertiary); background:var(--drama-surface-muted); }
.voice-form { display:grid; gap:16px; margin-top:20px; }.voice-form label { display:grid; gap:7px; font-size:12px; color:var(--drama-text-secondary); }.voice-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }.voice-actions .voice-upload { display:block; border:1px solid var(--drama-border); border-radius:6px; padding:7px 10px; cursor:pointer; background:white; }.voice-upload input { display:none; }.voice-hint,.voice-job { font-size:12px; color:var(--drama-text-secondary); line-height:1.8; margin:0; }.voice-hint { background:var(--drama-surface-muted); padding:12px; border-radius:6px; }.voice-sample { display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:12px 0; border-top:1px solid var(--drama-border-subtle); }.voice-sample>div { flex:1 1 150px; min-width:0; }.voice-sample strong { display:block; font-size:12px; overflow-wrap:anywhere; }.voice-sample small,.voice-job small { display:block; color:var(--drama-text-tertiary); font-size:11px; margin-top:5px; }.voice-form audio { width:100%; height:36px; }.voice-error { font-size:12px; color:var(--drama-danger); margin:0; }
</style>
