<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue';
import { previewShotVoices, saveShotSpeakers, type VoicePreview } from '@/api/shortDrama/voices';
import type { ShortDramaCharacter, ShortDramaStoryboard } from '@/api/shortDrama/types';
const props = defineProps<{ projectId: string; shot: ShortDramaStoryboard; characters: ShortDramaCharacter[]; model?: string; disabled?: boolean }>();
const emit = defineEmits<{ update: [continuityJson: string] }>();
const preview = ref<VoicePreview>();
const ids = ref<string[]>([]), error = shallowRef(''), busy = shallowRef(false);
let epoch = 0;
watch(() => [props.projectId, props.shot.id, props.model], () => { ++epoch; preview.value = undefined; error.value = ''; });
async function load(event?: Event) {
  if (event && !(event.target as HTMLDetailsElement).open) return;
  const token = epoch;
  try { const value = await previewShotVoices(props.projectId, String(props.shot.id), props.model); if (token !== epoch) return; preview.value = value; ids.value = value.speakerIds; }
  catch (e) { if (token === epoch) error.value = e instanceof Error ? e.message : String(e); }
}
async function save(reset = false) {
  busy.value = true; error.value = '';
  try {
    await saveShotSpeakers(props.projectId, String(props.shot.id), reset ? null : ids.value);
    const continuity = JSON.parse(props.shot.continuityJson || '{}');
    if (reset) delete continuity.voice_speakers; else continuity.voice_speakers = [...ids.value];
    emit('update', JSON.stringify(continuity)); await load();
  } catch (e) { error.value = e instanceof Error ? e.message : String(e); }
  finally { busy.value = false; }
}
</script>

<template>
  <details class="shot-voices" @toggle="load">
    <summary>本镜发言人与声音 <span v-if="preview">{{ preview.bindings.map(b => b.characterName).join('、') || '未带入角色样音' }}</span></summary>
    <div class="shot-voice-form">
      <el-select v-model="ids" multiple placeholder="本镜无角色对白" :disabled="busy || disabled" aria-label="本镜实际发言人"><el-option v-for="c in characters" :key="c.id" :value="String(c.id)" :label="c.name" /></el-select>
      <div class="shot-voice-actions"><el-button size="small" :disabled="busy || disabled || !preview" @click="save(false)">保存发言人</el-button><el-button size="small" text :disabled="busy || disabled" @click="save(true)">恢复自动识别</el-button><el-button size="small" text :disabled="busy" @click="load()">刷新绑定</el-button></div>
      <div v-for="b in preview?.bindings" :key="b.characterId" class="shot-voice-binding">{{ b.characterName }} → @音频{{ b.audioIndex }} · 样音v{{ b.version }} · {{ b.duration.toFixed(2) }}秒</div>
      <p v-for="issue in preview?.issues" :key="issue" class="shot-voice-error">{{ issue }}</p>
      <p v-if="error" class="shot-voice-error" role="alert">{{ error }}</p>
    </div>
  </details>
</template>

<style scoped>
.shot-voices{padding:8px 10px;border:1px solid #d9e3ee;border-radius:7px;margin:8px 0;background:#f8fafc;font-size:12px}.shot-voices summary{cursor:pointer;font-weight:600;display:flex;justify-content:space-between;gap:12px}.shot-voices summary span{font-weight:400;color:#61748a}.shot-voice-form{display:grid;gap:8px;padding-top:10px}.shot-voice-form p{margin:0;color:#64748b;line-height:1.6}.shot-voice-actions{display:flex;gap:8px;flex-wrap:wrap}.shot-voice-binding{color:#26784c}.shot-voice-form .shot-voice-error{color:#b15525}
</style>
