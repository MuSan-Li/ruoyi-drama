<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { ElMessage } from '@/utils/message';
import { uploadReferenceImage } from '@/api/shortDrama';
import { readShortDramaResource } from '@/api/shortDrama/resources';
import { del, post } from '@/utils/request';
import { requestErrorMessage } from '@/utils/requestFeedback';
import GeneratedAssetImage from './GeneratedAssetImage.vue';

const props = defineProps<{ projectId: string; storyboardId: string; sceneNo: number; continuityJson?: string; imageModel?: string }>();
const emit = defineEmits<{ updated: [] }>();

interface FrameAsset { id?: string; storyboardId?: string; kind?: string; imageUrl?: string; model?: string; predictionId?: string; prompt?: string; errorMessage?: string; status: string; title: string }
const assets = ref<FrameAsset[]>([]);
const error = ref('');
const loadFailed = ref(false);
const uploading = ref(false);
const removing = ref(false);
const revising = ref(false);
const editing = ref(false);
const revisedPrompt = ref('');
const localManualUrl = ref('');
const submitting = ref(false);
const queueRunning = ref(false);
const submissionUnknown = ref(false);
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let version = 0;

function savedManualUrl() {
  try {
    const url = JSON.parse(props.continuityJson || '{}')?.manual_start_frame?.url;
    return typeof url === 'string' && url.startsWith('https://') ? url : '';
  } catch { return ''; }
}
const uploadedFrameUrl = computed(() => localManualUrl.value || savedManualUrl());
const selected = computed(() => assets.value.find(asset => asset.kind === 'shot_frame' && String(asset.storyboardId) === String(props.storyboardId)));
const previewUrl = computed(() => uploadedFrameUrl.value || (selected.value?.status === 'done' ? selected.value.imageUrl || '' : ''));
const previewTitle = computed(() => uploadedFrameUrl.value ? '上传起始帧' : selected.value?.title || '本镜起始帧');
const previewModel = computed(() => uploadedFrameUrl.value ? '上传' : selected.value?.model);
const frameError = computed(() => error.value || (!previewUrl.value && selected.value?.status === 'failed'
  ? requestErrorMessage(selected.value.errorMessage, '起始帧生成失败，请重新生成或上传图片') : ''));
async function load() {
  const current = ++version;
  clearTimeout(pollTimer);
  try {
    const data = await readShortDramaResource<{ assets: FrameAsset[]; running?: boolean; error?: string }>(`/short-drama/${props.projectId}/visual-assets`);
    if (current !== version) return;
    if (!Array.isArray(data.assets)) throw new Error('镜头资产读取失败');
    assets.value = data.assets;
    queueRunning.value = !!data.running;
    loadFailed.value = false;
    if (selected.value || data.error) submissionUnknown.value = false;
    if (data.running) pollTimer = setTimeout(() => { void load(); }, 2500);
  } catch { if (current === version) loadFailed.value = true; }
}
watch(() => [props.projectId, props.storyboardId], () => {
  localManualUrl.value = '';
  assets.value = [];
  error.value = '';
  loadFailed.value = false;
  queueRunning.value = false;
  submissionUnknown.value = false;
  void load();
}, { immediate: true });
watch(() => props.continuityJson, () => {
  if (!savedManualUrl()) localManualUrl.value = '';
});

async function generateFrame() {
  if (submitting.value || queueRunning.value || loadFailed.value || previewUrl.value || !props.imageModel) return;
  submitting.value = true;
  error.value = '';
  try {
    const response: any = await post(`/short-drama/${props.projectId}/visual-assets/generate-range?model=${encodeURIComponent(props.imageModel)}&start=${props.sceneNo}&end=${props.sceneNo}`, {}).json();
    if (response.code !== undefined && response.code !== 200) throw new Error(response.msg || '起始帧生成失败');
    await load();
    ElMessage.success('本镜起始帧任务已提交');
  } catch (reason: any) {
    submissionUnknown.value = true;
    error.value = requestErrorMessage(reason, '提交结果未确认，请先查询进度');
  } finally { submitting.value = false; }
}
async function recoverFrame() {
  if (submitting.value) return;
  submitting.value = true;
  error.value = '';
  try {
    await post(`/short-drama/${props.projectId}/visual-assets/recover`, {}).json();
    await load();
  } catch (reason: any) { error.value = requestErrorMessage(reason, '读取进度失败'); }
  finally { submitting.value = false; }
}

async function upload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || uploading.value) return;
  if (!props.imageModel) { error.value = '请先选择图片模型'; return; }
  uploading.value = true; error.value = '';
  try {
    const imageUrl = await uploadReferenceImage(file, props.imageModel);
    await post(`/short-drama/${props.projectId}/visual-assets/${props.storyboardId}/start-frame`, { imageUrl }).json();
    localManualUrl.value = imageUrl;
    emit('updated');
    ElMessage.success('起始帧已保存');
  } catch (e: any) { error.value = requestErrorMessage(e, '起始帧上传失败'); }
  finally { uploading.value = false; }
}
async function removeUploadedFrame() {
  if (!uploadedFrameUrl.value || removing.value) return;
  removing.value = true; error.value = '';
  try {
    await del(`/short-drama/${props.projectId}/visual-assets/${props.storyboardId}/start-frame`).json();
    localManualUrl.value = '';
    emit('updated');
    ElMessage.success('已移除上传起始帧');
  } catch (e: any) { error.value = requestErrorMessage(e, '移除起始帧失败'); }
  finally { removing.value = false; }
}
function openRevision() {
  if (!selected.value?.id) return;
  revisedPrompt.value = selected.value.prompt || '';
  editing.value = true;
}
async function reviseFrame() {
  if (!selected.value?.id || !revisedPrompt.value.trim() || revising.value) return;
  if (!props.imageModel) { error.value = '请先选择图片模型'; return; }
  revising.value = true; error.value = '';
  try {
    await post(`/short-drama/${props.projectId}/visual-assets/${selected.value.id}/revise`, { prompt: revisedPrompt.value, model: props.imageModel }).json();
    editing.value = false;
    emit('updated');
    await load();
    ElMessage.success('起始帧修正任务已提交');
  } catch (e: any) { error.value = requestErrorMessage(e, '起始帧修正失败'); }
  finally { revising.value = false; }
}
onUnmounted(() => { version++; clearTimeout(pollTimer); });
</script>
<template>
  <section class="frame-preview" aria-label="本镜起始帧">
    <div class="frame-head">
      <div><strong>本镜起始帧（可选）</strong></div>
      <div class="frame-actions">
        <el-button v-if="loadFailed" size="small" @click="load">重新读取</el-button>
        <el-button v-if="!previewUrl && (submissionUnknown || selected?.status === 'waiting' || selected?.status === 'generating')" size="small" :loading="submitting" :disabled="queueRunning" @click="recoverFrame">查询起始帧</el-button>
        <el-button v-else-if="!previewUrl && !loadFailed" size="small" :loading="submitting" :disabled="queueRunning || !imageModel" @click="generateFrame">生成起始帧</el-button>
        <label class="frame-upload">{{ uploading ? '上传中…' : '上传起始帧' }}<input type="file" accept="image/png,image/jpeg,image/webp" :disabled="uploading || removing" aria-label="上传起始帧" @change="upload" /></label>
        <el-button v-if="selected && !uploadedFrameUrl" size="small" text :disabled="uploading || removing || selected.status === 'generating' || selected.status === 'waiting'" @click="openRevision">修正构图</el-button>
        <el-button v-if="uploadedFrameUrl" size="small" text :loading="removing" :disabled="uploading" @click="removeUploadedFrame">移除上传帧</el-button>
      </div>
    </div>
    <GeneratedAssetImage v-if="previewUrl" class="frame-image" :src="previewUrl" :title="previewTitle" :model="previewModel" :prediction-id="selected?.predictionId" />
    <p v-if="frameError" class="frame-error" role="alert">{{ frameError }}</p>
    <el-dialog v-model="editing" title="修正本镜起始帧" width="min(720px,94vw)" :close-on-click-modal="!revising" :show-close="!revising">
      <el-input v-model="revisedPrompt" type="textarea" :rows="10" maxlength="12000" aria-label="修正起始帧描述" />
      <template #footer><el-button :disabled="revising" @click="editing = false">取消</el-button><el-button type="primary" :loading="revising" @click="reviseFrame">保存并重生本图</el-button></template>
    </el-dialog>
  </section>
</template>
<style scoped>
.frame-preview { display:flex; flex-direction:column; gap:10px; margin:16px 0; padding:16px; border:1px solid #d7e3ef; border-radius:10px; background:#f8fafc; }
.frame-head,.frame-head>div,.frame-actions { display:flex; align-items:center; gap:10px; }.frame-head { justify-content:space-between; }.frame-preview strong { font-size:14px; }.frame-head span { color:#94a3b8; font-size:12px; }.frame-upload { display:inline-flex; align-items:center; min-height:30px; padding:0 10px; border:1px solid #cbd5e1; border-radius:6px; background:#fff; color:#475569; font-size:12px; cursor:pointer; }.frame-upload input { display:none; }.frame-upload:has(input:disabled) { opacity:.55; cursor:wait; }
.frame-image { width:min(100%,480px); --asset-image-height:auto; }
.frame-preview p { margin:0; font-size:12px; line-height:1.6; }.frame-error { color:var(--el-color-danger); }
@media (max-width: 720px) { .frame-head { align-items:flex-start; flex-direction:column; }.frame-actions { flex-wrap:wrap; } }
</style>
