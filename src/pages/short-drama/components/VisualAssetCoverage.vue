<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { ElMessage } from '@/utils/message';
import { uploadReferenceImage } from '@/api/shortDrama';
import { get, post, put } from '@/utils/request';
import GeneratedAssetImage from './GeneratedAssetImage.vue';
import type { ShortDramaStoryboard } from '@/api/shortDrama/types';

interface VisualAsset {
  id: string;
  storyboardId?: string;
  kind: 'prop' | 'shot_frame' | 'source';
  title: string;
  status: string;
  imageUrl?: string;
  prompt: string;
  model?: string;
  predictionId?: string;
  errorMessage?: string;
  referenceImageUrl?: string;
  undoAvailable?: boolean;
}

interface Snapshot {
  running: boolean;
  phase: string;
  error: string;
  assets: VisualAsset[];
  completed: number;
  total: number;
}

const props = defineProps<{ projectId: string; imageModel?: string; shots?: ShortDramaStoryboard[]; editing?: boolean }>();
const emit = defineEmits<{
  select: [id: string];
  stats: [value: { props: number; materials: number; completed: number; total: number }];
}>();

const snapshot = ref<Snapshot>({ running: false, phase: 'idle', error: '', assets: [], completed: 0, total: 0 });
const error = ref('');
const promptDrafts = ref<Record<string, string>>({});
const referenceDrafts = ref<Record<string, string>>({});
const savingProps = ref<Record<string, boolean>>({});
const generatingProps = ref<Record<string, boolean>>({});
const uploadingReferences = ref<Record<string, boolean>>({});
let timer: ReturnType<typeof setTimeout> | undefined;
let epoch = 0;

const sourceMaterials = computed<VisualAsset[]>(() => (props.shots || []).flatMap(shot => {
  try {
    const sourceMedia = JSON.parse(shot.continuityJson || '{}').source_media;
    return sourceMedia?.mode === 'direct_insert'
      ? [{
          id: `source-${shot.id}`,
          storyboardId: shot.id,
          kind: 'source' as const,
          title: `镜 ${shot.sceneNo} · ${shot.sceneTitle}`,
          prompt: sourceMedia.filename || sourceMedia.label || '',
          status: sourceMedia.url ? 'done' : 'pending',
          imageUrl: sourceMedia.url,
        }]
      : [];
  } catch {
    return [];
  }
}));

// 起始帧在分镜中维护，不混入项目级的道具与素材卡片。
const currentAssets = computed(() => snapshot.value.assets.filter(asset => asset.kind !== 'shot_frame' && asset.status !== 'archived'));
const displayedAssets = computed(() => [...currentAssets.value, ...sourceMaterials.value]
  .sort((left, right) => Number(left.kind === 'source') - Number(right.kind === 'source')));
const propCount = computed(() => currentAssets.value.filter(asset => asset.kind === 'prop').length);
const materialCount = computed(() => sourceMaterials.value.length);
const total = computed(() => displayedAssets.value.length);
const completed = computed(() => displayedAssets.value.filter(asset => asset.status === 'done').length);

watch([propCount, materialCount, completed, total], ([propsCount, materials, completedCount, totalCount]) => {
  emit('stats', { props: propsCount, materials, completed: completedCount, total: totalCount });
}, { immediate: true });

const statusLabels: Record<string, string> = {
  pending: '待生成',
  generating: '生成中',
  waiting: '等待结果',
  done: '已生成 · 待审阅',
  failed: '失败可重试',
};

function statusLabel(asset: VisualAsset) {
  if (asset.kind === 'source') return asset.status === 'done' ? '已绑定' : '待上传';
  return statusLabels[asset.status] || asset.status;
}

function ensureDraft(asset: VisualAsset) {
  if (!(asset.id in promptDrafts.value)) promptDrafts.value[asset.id] = asset.prompt || '';
  if (!(asset.id in referenceDrafts.value)) referenceDrafts.value[asset.id] = asset.referenceImageUrl || '';
}

function hydrateDrafts(assets: VisualAsset[]) {
  for (const asset of assets) {
    if (asset.kind !== 'prop') continue;
    if (props.editing && asset.id in promptDrafts.value) continue;
    promptDrafts.value[asset.id] = asset.prompt || '';
    referenceDrafts.value[asset.id] = asset.referenceImageUrl || '';
  }
}

function applySnapshot(data: Snapshot) {
  snapshot.value = data;
  hydrateDrafts(data.assets);
}

async function refresh(version = epoch) {
  if (version !== epoch) return;
  clearTimeout(timer);
  try {
    const response: any = await get(`/short-drama/${props.projectId}/visual-assets`).json();
    if (version !== epoch) return;
    const data = response.data || response;
    if (!Array.isArray(data.assets)) throw new Error(response.msg || '资产请求未成功');
    applySnapshot(data);
    error.value = '';
  } catch (reason: any) {
    if (version === epoch) error.value = reason.message || '读取资产进度失败';
  } finally {
    if (version === epoch && snapshot.value.running) timer = setTimeout(() => refresh(version), 2500);
  }
}

async function saveProp(asset: VisualAsset, successMessage = ''): Promise<boolean> {
  ensureDraft(asset);
  const prompt = promptDrafts.value[asset.id]?.trim();
  if (!prompt) {
    ElMessage.warning('请填写道具提示词');
    return false;
  }
  savingProps.value[asset.id] = true;
  error.value = '';
  try {
    const response: any = await put(`/short-drama/${props.projectId}/visual-assets/prop/${asset.id}`, {
      prompt,
      referenceImageUrl: referenceDrafts.value[asset.id] || '',
    }).json();
    const data = response.data || response;
    if (!Array.isArray(data.assets)) throw new Error(response.msg || '保存道具提示词失败');
    applySnapshot(data);
    if (successMessage) ElMessage.success(successMessage);
    return true;
  } catch (reason: any) {
    error.value = reason.message || '保存道具提示词失败';
    return false;
  } finally {
    savingProps.value[asset.id] = false;
  }
}

async function handleReferenceFileSelected(asset: VisualAsset, event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (!props.imageModel) {
    ElMessage.warning('当前项目未配置图片模型');
    return;
  }
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件');
    return;
  }
  const previous = referenceDrafts.value[asset.id] || asset.referenceImageUrl || '';
  uploadingReferences.value[asset.id] = true;
  try {
    referenceDrafts.value[asset.id] = await uploadReferenceImage(file, props.imageModel);
    const saved = await saveProp(asset);
    if (!saved) referenceDrafts.value[asset.id] = previous;
    else ElMessage.success('参考图已保存，将用于下一次生成');
  } catch (reason: any) {
    referenceDrafts.value[asset.id] = previous;
    ElMessage.error(reason.message || '参考图上传失败');
  } finally {
    uploadingReferences.value[asset.id] = false;
  }
}

async function removeReference(asset: VisualAsset) {
  ensureDraft(asset);
  const previous = referenceDrafts.value[asset.id];
  referenceDrafts.value[asset.id] = '';
  if (await saveProp(asset, '已移除参考图')) return;
  referenceDrafts.value[asset.id] = previous;
}

async function regenerateProp(asset: VisualAsset) {
  if (!props.imageModel) {
    ElMessage.warning('当前项目未配置图片模型');
    return;
  }
  if (!await saveProp(asset)) return;
  generatingProps.value[asset.id] = true;
  error.value = '';
  try {
    const response: any = await post(
      `/short-drama/${props.projectId}/visual-assets/prop/${asset.id}/regenerate?model=${encodeURIComponent(props.imageModel)}`,
      {},
    ).json();
    const data = response.data || response;
    if (!Array.isArray(data.assets)) throw new Error(response.msg || '道具生成任务未启动');
    applySnapshot(data);
    clearTimeout(timer);
    void refresh();
    ElMessage.success('道具生成任务已启动，当前版本会保留到新图完成');
  } catch (reason: any) {
    error.value = reason.message || '道具生成任务未启动';
  } finally {
    generatingProps.value[asset.id] = false;
  }
}

async function undoProp(asset: VisualAsset) {
  generatingProps.value[asset.id] = true;
  error.value = '';
  try {
    const response: any = await post(
      `/short-drama/${props.projectId}/visual-assets/prop/${asset.id}/undo`,
      {},
    ).json();
    const data = response.data || response;
    if (!Array.isArray(data.assets)) throw new Error(response.msg || '道具撤销失败');
    applySnapshot(data);
    ElMessage.success('已恢复上一版道具');
  } catch (reason: any) {
    error.value = reason.message || '道具撤销失败';
  } finally {
    generatingProps.value[asset.id] = false;
  }
}

async function saveAllPrompts() {
  const changed = currentAssets.value.filter(asset => asset.kind === 'prop').filter(asset => {
    ensureDraft(asset);
    return promptDrafts.value[asset.id]?.trim() !== (asset.prompt || '').trim()
      || (referenceDrafts.value[asset.id] || '') !== (asset.referenceImageUrl || '');
  });
  for (const asset of changed) {
    if (!await saveProp(asset)) throw new Error(error.value || '道具提示词保存失败');
  }
}

async function generateMissingProps(): Promise<number> {
  await refresh();
  if (error.value) throw new Error(error.value);
  if (snapshot.value.running) throw new Error('道具任务正在进行，请等待完成');
  const missing = currentAssets.value.filter(asset => asset.kind === 'prop' && !asset.imageUrl?.trim()
    && !asset.predictionId?.trim() && ['pending', 'failed'].includes(asset.status));
  if (!missing.length) return 0;
  if (!props.imageModel) throw new Error('后台尚未配置可用图片模型');
  await saveAllPrompts();
  const response: any = await post(`/short-drama/${props.projectId}/visual-assets/generate-props?model=${encodeURIComponent(props.imageModel)}`, {}).json();
  const data = response.data || response;
  if (!Array.isArray(data.assets)) throw new Error('道具生成任务未确认，请刷新查看');
  applySnapshot(data);
  void refresh();
  return missing.length;
}

defineExpose({ refresh, saveAllPrompts, generateMissingProps, running: computed(() => snapshot.value.running) });

watch(() => props.projectId, () => {
  epoch++;
  clearTimeout(timer);
  snapshot.value = { running: false, phase: 'idle', error: '', assets: [], completed: 0, total: 0 };
  promptDrafts.value = {};
  referenceDrafts.value = {};
  void refresh();
}, { immediate: true });

onUnmounted(() => {
  epoch++;
  clearTimeout(timer);
});
</script>

<template>
  <section class="coverage" aria-label="道具与素材">
    <el-tag v-if="snapshot.running" class="coverage-running" type="primary" effect="plain">{{ snapshot.phase }}</el-tag>

    <p v-if="snapshot.error || error" role="alert" class="coverage-error">{{ snapshot.error || error }}</p>

    <el-empty v-if="!total" description="暂无道具或素材" />

    <div v-else class="coverage-card-list">
      <article v-for="asset in displayedAssets" :key="asset.id" class="coverage-card">
        <div class="coverage-card-head">
          <strong class="coverage-asset-name">{{ asset.title }}</strong>
          <div class="coverage-tags">
            <el-tag size="small" :type="asset.kind === 'source' ? 'info' : 'warning'">{{ asset.kind === 'source' ? '素材' : '道具' }}</el-tag>
            <el-tag size="small" :type="asset.status === 'failed' ? 'danger' : asset.status === 'done' ? 'success' : 'info'">{{ statusLabel(asset) }}</el-tag>
          </div>
        </div>

        <div class="coverage-media">
          <GeneratedAssetImage
            v-if="asset.imageUrl"
            :src="asset.imageUrl"
            :title="asset.title"
            :model="asset.status === 'done' ? asset.model : undefined"
            :prediction-id="asset.status === 'done' ? asset.predictionId : undefined"
          />
          <div v-else class="coverage-placeholder">{{ statusLabel(asset) }}</div>
        </div>
        <p v-if="asset.errorMessage" class="coverage-error">{{ asset.errorMessage }}</p>

        <template v-if="asset.kind === 'prop'">
          <div class="prop-actions">
            <el-button size="small" :loading="savingProps[asset.id]" @click="saveProp(asset)">保存提示词</el-button>
            <el-button size="small" :loading="generatingProps[asset.id]" :disabled="snapshot.running || savingProps[asset.id]" @click="regenerateProp(asset)">生成图片</el-button>
            <el-button v-if="asset.imageUrl" size="small" type="warning" plain :loading="generatingProps[asset.id]" :disabled="snapshot.running || savingProps[asset.id]" @click="regenerateProp(asset)">重新生成</el-button>
            <el-button v-if="asset.undoAvailable" size="small" type="warning" plain :loading="generatingProps[asset.id]" :disabled="snapshot.running || savingProps[asset.id]" @click="undoProp(asset)">撤销</el-button>
          </div>

          <el-input
            v-model="promptDrafts[asset.id]"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 8 }"
            :disabled="!editing"
            maxlength="12000"
            show-word-limit
            aria-label="道具提示词"
          />

          <div class="asset-reference-input">
            <span class="asset-reference-label">上传照片作为参考</span>
            <label class="reference-upload-button" :class="{ disabled: uploadingReferences[asset.id] || snapshot.running }">
              {{ uploadingReferences[asset.id] ? '上传中…' : (referenceDrafts[asset.id] ? '更换照片' : '选择照片') }}
              <input type="file" accept="image/*" :disabled="uploadingReferences[asset.id] || snapshot.running" @change="handleReferenceFileSelected(asset, $event)" />
            </label>
            <img
              v-if="referenceDrafts[asset.id]"
              :src="referenceDrafts[asset.id]"
              alt="道具参考图预览"
              class="asset-reference-preview"
              referrerpolicy="no-referrer"
            />
            <el-button v-if="referenceDrafts[asset.id]" size="small" text type="danger" :disabled="snapshot.running" @click="removeReference(asset)">移除</el-button>
          </div>
        </template>

        <details v-else class="coverage-details">
          <summary>素材信息</summary>
          <p>{{ asset.prompt || '暂无描述' }}</p>
          <small v-if="asset.model">{{ asset.model }}</small>
        </details>
        <el-button v-if="asset.storyboardId" size="small" text @click="emit('select', asset.storyboardId)">查看对应分镜</el-button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.coverage { margin: 0; color: #334155; }
.coverage-running { margin-bottom: 12px; }
.coverage-card-list { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(360px, 100%), 1fr)); }
.coverage-card-list, .coverage-card { box-sizing: border-box; }
.coverage-card { min-width: 0; padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fbfcfd; display: grid; align-content: start; gap: 10px; }
.coverage-card-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; }
.coverage-asset-name { color: #242a33; font-size: 15px; font-weight: 750; }
.coverage-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.coverage-media { width: 100%; min-height: 180px; max-height: 260px; overflow: hidden; border: 1px solid #edf0f4; border-radius: 7px; background: #f5f7fa; }
.coverage-media :deep(.generated-image), .coverage-media :deep(.generated-image .el-image), .coverage-placeholder { width: 100%; height: 100%; min-height: 180px; }
.coverage-media :deep(.generated-image .el-image) { display: block; max-height: 260px; }
.coverage-placeholder { display: grid; place-items: center; color: #64748b; font-size: 13px; }
.coverage-retained { margin: -3px 0 0; color: #64748b; font-size: 12px; }
.prop-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.prop-actions .el-button { margin: 0; }
.prop-prompt { max-height: 144px; margin: 0; overflow: auto; color: #64748b; font-size: 12px; line-height: 1.7; white-space: pre-wrap; }
.asset-reference-input { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; min-width: 0; padding-top: 2px; }
.asset-reference-label { color: #64748b; font-size: 12px; }
.reference-upload-button { display: inline-flex; align-items: center; min-height: 28px; padding: 0 10px; border: 1px solid #dcdfe6; border-radius: 4px; color: #475569; background: #fff; font-size: 12px; cursor: pointer; }
.reference-upload-button.disabled { opacity: .55; cursor: not-allowed; }
.reference-upload-button input { display: none; }
.asset-reference-preview { width: 42px; height: 42px; border: 1px solid #dbeafe; border-radius: 5px; object-fit: cover; }
.coverage-details { color: #64748b; font-size: 12px; line-height: 1.6; }
.coverage-details p { max-height: 120px; margin: 6px 0; overflow: auto; white-space: pre-wrap; }
.coverage-details small { color: #94a3b8; }
.coverage-error { margin: 0; color: #b42318; font-size: 12px; overflow-wrap: anywhere; }
@media (max-width: 640px) { .coverage-card { padding: 12px; } .coverage-card-head { align-items: flex-start; } }
</style>
