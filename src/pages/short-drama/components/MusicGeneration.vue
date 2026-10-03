<script setup lang="ts">
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { computed, onUnmounted, reactive, shallowRef, watch } from 'vue';
import { ElMessage } from '@/utils/message';
import type { GetSessionListVO } from '@/api/model/types';
import { generateMusic, useMusic, writeMusic, type MusicJob, type MusicPurpose } from '@/api/shortDrama/music';
import { useMusicTasks } from '@/composables/useMusicTasks';
import { useUserStore } from '@/stores';
const props = defineProps<{ projectId: string; models: GetSessionListVO[]; writingModel: string; shotNumbers: number[] }>();
const emit = defineEmits<{ changed: [] }>();
const { jobs, error: taskError, refresh } = useMusicTasks(() => props.projectId);
const form = reactive({ model: '', purpose: 'bgm' as MusicPurpose, title: '', prompt: '', style: 'cinematic instrumental underscore, restrained dynamics, spacious, no vocals', duration: 180, vocalGender: 'Male' as 'Male' | 'Female', negativeTags: 'EDM, rap, aggressive percussion', direction: '' });
const busy = shallowRef(false), writing = shallowRef(false), applying = shallowRef(false), error = shallowRef(''), preview = shallowRef(''), previewName = shallowRef('');
const usage = reactive({ shots: '', volume: 0.10, offset: 0 });
const labels: Record<string, string> = { submitting: '提交中', submission_unknown: '提交结果未知，请核对平台', processing: '生成中', saving: '保存音轨中', completed: '已完成', failed: '失败' };
const purposeLabels = { bgm: '纯音乐 BGM', theme: '主题曲', ending: '片尾曲' };
const activeModel = computed(() => props.models.find(model => model.modelName === form.model));
watch(() => props.models, list => { if (!list.some(m => m.modelName === form.model)) form.model = list[0]?.modelName || ''; }, { immediate: true });
watch(() => form.purpose, purpose => { form.duration = purpose === 'bgm' ? 180 : 75; form.style = purpose === 'bgm' ? 'cinematic instrumental underscore, restrained dynamics, spacious, no vocals' : 'Mandarin cinematic ballad, warm male vocal, piano, restrained strings, intimate'; form.prompt = ''; form.title = ''; });
watch(() => props.projectId, () => { form.title = ''; form.prompt = ''; form.direction = ''; error.value = ''; if (preview.value) URL.revokeObjectURL(preview.value); preview.value = ''; });
function message(e: unknown) { return e instanceof Error ? e.message : '音乐操作失败'; }
async function draft() {
  writing.value = true; error.value = ''; const project = props.projectId;
  try { const brief = await writeMusic(project, { model: props.writingModel, purpose: form.purpose, direction: form.direction }); if (project === props.projectId) Object.assign(form, brief); }
  catch (e) { if (project === props.projectId) error.value = message(e); } finally { writing.value = false; }
}
async function submit() {
  busy.value = true; error.value = ''; const project = props.projectId;
  try { await generateMusic(project, { requestId: crypto.randomUUID(), model: form.model, purpose: form.purpose, title: form.title, prompt: form.prompt, style: form.style, duration: form.duration, vocalGender: form.vocalGender, negativeTags: form.negativeTags }); if (project === props.projectId) await refresh(); }
  catch (e) { if (project === props.projectId) { error.value = message(e); await refresh(); } } finally { busy.value = false; }
}
async function listen(job: MusicJob, variant: MusicJob['variants'][number]) {
  const project = props.projectId;
  try { const base = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, ''); const response = await authenticatedFetch(`${base}/short-drama/${project}/sounds/${variant.soundId}`, { headers: { Authorization: `Bearer ${useUserStore().token}`, ClientID: import.meta.env.VITE_CLIENT_ID } }); if (!response.ok) throw new Error('试听加载失败'); const blob = await response.blob(); if (project !== props.projectId) return; if (preview.value) URL.revokeObjectURL(preview.value); preview.value = URL.createObjectURL(blob); previewName.value = `${job.request.title} · 版本${variant.index + 1}`; }
  catch (e) { if (project === props.projectId) error.value = message(e); }
}
async function apply(job: MusicJob, variant: number, enabled: boolean) {
  const shots = usage.shots.split(/[,，\s]+/).filter(Boolean).map(Number);
  if (enabled && (!shots.length || shots.some(n => !Number.isInteger(n) || !props.shotNumbers.includes(n)))) { error.value = '请填写本项目已有的镜号，用逗号分隔'; return; }
  applying.value = true; error.value = '';
  try { await useMusic(props.projectId, job.id, { variant, shots, volume: usage.volume, offset: usage.offset, enabled }); emit('changed'); ElMessage.success(enabled ? '已选用此版本，同任务其他版本已移出混音' : '已移出混音，素材仍可试听'); }
  catch (e) { error.value = message(e); } finally { applying.value = false; }
}
onUnmounted(() => { if (preview.value) URL.revokeObjectURL(preview.value); });
</script>
<template>
  <details class="music-panel" open>
    <summary>音乐创作 · BGM / 主题曲 / 片尾曲 <span>{{ jobs.length }} 个任务</span></summary>
    <fieldset class="music-grid" :disabled="busy || writing">
      <label>音乐模型<select v-model="form.model" aria-label="音乐模型"><option v-for="m in models" :key="m.modelName" :value="m.modelName">{{ m.modelDescribe || m.modelName }}</option></select></label>
      <label>音乐用途<select v-model="form.purpose" aria-label="音乐用途"><option v-for="(name, code) in purposeLabels" :key="code" :value="code">{{ name }}</option></select></label>
      <label>曲名<input v-model="form.title" maxlength="50" aria-label="音乐曲名" placeholder="如：灯下这笔账"></label>
      <label>目标时长 / 秒<input v-model.number="form.duration" type="number" min="10" max="360" aria-label="音乐目标时长"></label>
      <label v-if="form.purpose !== 'bgm'">演唱声线<select v-model="form.vocalGender" aria-label="演唱声线"><option value="Male">男声</option><option value="Female">女声</option></select></label>
      <label class="wide">创作要求<input v-model="form.direction" maxlength="2000" aria-label="音乐创作要求" placeholder="将依据已保存剧本起草，可指定情绪、意象、歌词方向"></label>
      <label class="wide">音乐风格<textarea v-model="form.style" rows="2" maxlength="1000" aria-label="音乐风格" /><small>{{ form.style.length }} / 1000 字符</small></label>
      <label class="wide">{{ form.purpose === 'bgm' ? '纯器乐发展描述（可留空）' : '原创歌词（可编辑）' }}<textarea v-model="form.prompt" rows="7" maxlength="3000" aria-label="歌词或音乐描述" placeholder="歌曲支持 [Verse]、[Chorus] 等分段；纯音乐无需歌词" /><small>{{ form.prompt.length }} / 3000 字符</small></label>
      <label class="wide">排除风格<input v-model="form.negativeTags" maxlength="1000" aria-label="排除音乐风格"></label>
    </fieldset>
    <div class="actions"><el-button :loading="writing" :disabled="!writingModel || busy || writing" @click="draft">用当前写作模型起草</el-button><el-button type="primary" :loading="busy" :disabled="!activeModel || !form.title.trim() || !form.style.trim() || (form.purpose !== 'bgm' && !form.prompt.trim()) || writing || busy" @click="submit">生成两版音乐</el-button><el-button @click="refresh">刷新任务</el-button></div>
    <div class="music-grid usage"><label>使用镜号<input v-model="usage.shots" aria-label="生成音乐使用镜号" placeholder="例如 1,2,3"></label><label>混音音量<input v-model.number="usage.volume" type="number" min="0" max="1" step="0.01" aria-label="生成音乐混音音量"></label><label>素材起点 / 秒<input v-model.number="usage.offset" type="number" min="0" step="0.1" aria-label="生成音乐素材起点"></label></div>
    <article v-for="job in jobs" :key="job.id" class="music-job">
      <div class="job-heading"><strong>{{ job.request.title }}</strong><span>{{ purposeLabels[job.request.purpose] }} · {{ labels[job.status] || job.status }}</span></div>
      <p v-if="job.error" role="alert">{{ job.error }}</p>
      <div v-for="v in job.variants" :key="v.index" class="variant"><span>版本 {{ v.index + 1 }} · {{ v.duration.toFixed(1) }} 秒</span><el-button size="small" :disabled="job.status !== 'completed'" @click="listen(job, v)">试听</el-button><el-button size="small" :disabled="job.status !== 'completed' || applying" @click="apply(job, v.index, true)">选用此版</el-button><el-button size="small" :disabled="job.status !== 'completed' || applying" @click="apply(job, v.index, false)">移出混音</el-button></div>
      <details><summary>查看生成文案</summary><p>{{ job.request.style }}</p><pre>{{ job.request.prompt }}</pre></details>
    </article>
    <div v-if="preview" class="player"><strong>{{ previewName }}</strong><audio :src="preview" controls autoplay /></div>
    <p v-if="error || taskError" role="alert" class="error">{{ error || taskError }}</p>
  </details>
</template>
<style scoped>
.music-panel{border:1px solid #cddbeb;border-radius:12px;padding:20px;margin:16px 0;background:linear-gradient(135deg,#f3f7ff,#faf7f1)}summary{cursor:pointer;font-weight:600}summary span,.music-panel p,small{font-size:12px;color:#64748b}.music-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:16px 0;border:0;padding:0;min-width:0}.wide{grid-column:1/-1}label{display:flex;flex-direction:column;gap:6px;font-size:13px}input,select,textarea{width:100%;box-sizing:border-box}input,textarea{border:1px solid #cbd5e1;border-radius:7px;padding:9px;background:white;font:inherit}textarea{resize:vertical}.actions,.variant,.job-heading{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.music-job{padding:16px;background:white;border:1px solid #e2e8f0;border-radius:9px;margin-top:12px}.job-heading span{font-size:12px;color:#64748b}.variant{margin:12px 0}.variant span{font-size:13px}.player{display:grid;gap:8px;margin:16px 0}audio{width:min(100%,600px)}pre{white-space:pre-wrap;font:inherit;font-size:13px}.music-panel .error{color:#b42318}
</style>
