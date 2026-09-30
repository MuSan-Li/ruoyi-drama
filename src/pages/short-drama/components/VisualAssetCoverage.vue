<script setup lang="ts">
import ShotBatchSelect from './ShotBatchSelect.vue';
import FixedPropEditor from './FixedPropEditor.vue';
import { computed, onUnmounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { get, post } from '@/utils/request';
import GeneratedAssetImage from './GeneratedAssetImage.vue';
import type { ShortDramaStoryboard } from '@/api/shortDrama/types';

interface VisualAsset {
  id: string; storyboardId?: string; kind: 'prop' | 'shot_frame' | 'source'; title: string;
  status: string; imageUrl?: string; prompt: string; model?: string; predictionId?: string; errorMessage?: string;
}
interface Snapshot { outdated?: boolean; running: boolean; phase: string; error: string; assets: VisualAsset[]; completed: number; total: number }
const props = defineProps<{ projectId: string; imageModel: string; chatModel: string; shots?:ShortDramaStoryboard[] }>();
const emit = defineEmits<{ select: [id: string] }>();
const snapshot = ref<Snapshot>({ running: false, phase: 'idle', error: '', assets: [], completed: 0, total: 0 });
const requesting = ref(false);
const error = ref('');
const kind = ref('all');
const page = ref(1);
const batchStart = ref(1);
const editing = ref<VisualAsset | null>(null);
const revisedPrompt = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;
let epoch = 0;
const sourceMaterials = computed<VisualAsset[]>(() => (props.shots || []).flatMap(s => {
  try { const m=JSON.parse(s.continuityJson || '{}').source_media; return m?.mode==='direct_insert' ? [{id:`source-${s.id}`,storyboardId:s.id,kind:'source' as const,title:`镜 ${s.sceneNo} · ${s.sceneTitle}`,prompt:m.filename || m.label || '',status:m.url ? 'done' : 'pending',imageUrl:m.url}] : []; }
  catch { return []; }
}));
const total=computed(()=>Number(snapshot.value.total)+sourceMaterials.value.length);
const completed=computed(()=>Number(snapshot.value.completed)+sourceMaterials.value.filter(a=>a.status==='done').length);
const analyzing = computed(() => snapshot.value.running && snapshot.value.phase.includes('分析'));
const filtered = computed(() => [...snapshot.value.assets,...sourceMaterials.value].filter(a => kind.value === 'all' || a.kind === kind.value));
const visible = computed(() => filtered.value.slice((page.value - 1) * 12, page.value * 12));
const propsCount = computed(() => snapshot.value.assets.filter(a => a.kind === 'prop').length);
const frameCount = computed(() => snapshot.value.assets.filter(a => a.kind === 'shot_frame').length);
const labels: Record<string,string> = { pending: '待生成', generating: '生成中', waiting: '等待结果', done: '已生成 · 待审阅', failed: '失败可重试' };
watch(kind, () => { page.value = 1; });
async function refresh(version = epoch) {
  if (version !== epoch) return;
  clearTimeout(timer);
  try {
    const response: any = await get(`/short-drama/${props.projectId}/visual-assets`).json();
    if (version !== epoch) return;
    const data = response.data || response;
    if (!Array.isArray(data.assets)) throw new Error(response.msg || '资产请求未成功');
    snapshot.value = data;
    error.value = '';
  } catch (e: any) { if (version === epoch) error.value = e.message || '读取资产进度失败'; }
  finally { if (version === epoch && snapshot.value.running) timer = setTimeout(() => refresh(version), 2500); }
}
watch(() => props.projectId, () => { epoch++; clearTimeout(timer); snapshot.value = { running: false, phase: 'idle', error: '', assets: [], completed: 0, total: 0 }; page.value = 1; void refresh(); }, { immediate: true });
onUnmounted(() => { epoch++; clearTimeout(timer); });
async function run(action: 'plan' | 'generate' | 'recover' | 'generate-opening') {
  const model = action === 'plan' ? props.chatModel : props.imageModel;
  if (!model) { ElMessage.warning('请先选择对应模型'); return; }
  requesting.value = true; error.value = '';
  try {
    const endpoint = action === 'generate-opening' ? `generate-range?start=${batchStart.value}&end=${Math.min(batchStart.value+9, props.shots?.length || 10)}&model=${encodeURIComponent(model)}` : `${action}?model=${encodeURIComponent(model)}`;
    const response: any = await post(`/short-drama/${props.projectId}/visual-assets/${endpoint}`, {}).json();
    const data = response.data || response;
    if (!Array.isArray(data.assets)) throw new Error(response.msg || '资产请求未成功');
    snapshot.value = data;
    clearTimeout(timer); void refresh();
    ElMessage.success(action === 'plan' ? '资产分析已启动，已有定妆图与分镜将保留' : '生成队列已启动，可离开页面后查看进度');
  } catch(e: any) { error.value = e.message || '任务启动失败'; }
  finally { requesting.value = false; }
}
async function revise() {
  if (!editing.value || !revisedPrompt.value.trim() || !props.imageModel) return;
  requesting.value = true; error.value = '';
  try {
    const response: any = await post(`/short-drama/${props.projectId}/visual-assets/${editing.value.id}/revise`, { prompt: revisedPrompt.value, model: props.imageModel }).json();
    const data = response.data || response;
    if (!Array.isArray(data.assets)) throw new Error(response.msg || '修正任务未成功');
    snapshot.value = data; editing.value = null; clearTimeout(timer); void refresh();
    ElMessage.success('已开始重生本镜关键帧，其他镜头保留');
  } catch(e: any) { error.value = e.message || '修正任务启动失败'; }
  finally { requesting.value = false; }
}
</script>
<template>
  <section class="coverage" aria-label="镜头资产覆盖">
      <div class="coverage-title"><div><h3>镜头资产</h3></div>
      <div class="coverage-actions"><FixedPropEditor :project-id="projectId" :image-model="imageModel" @saved="refresh()" /><ShotBatchSelect v-model="batchStart" :total="shots?.length || 0" :disabled="snapshot.running || requesting" /><el-button :disabled="snapshot.running || requesting" @click="run('generate-opening')">生成本批资产</el-button><el-button :disabled="snapshot.outdated || snapshot.running || requesting" @click="run('plan')">分析镜头资产</el-button><el-button type="primary" :disabled="snapshot.outdated || !snapshot.total || snapshot.running || requesting" @click="run('generate')">生成缺失资产 / 重试失败</el-button><el-button v-if="!snapshot.running && snapshot.assets.some(a => ['generating','waiting'].includes(a.status) && a.predictionId)" :disabled="requesting" @click="run('recover')">仅恢复已提交任务</el-button><el-button :disabled="requesting" @click="refresh()">刷新</el-button></div>
    </div>
    <p v-if="snapshot.outdated" class="coverage-error">剧本已修改，以下清单属于旧版。请先规划新版分镜，再分析资产；已完成图片保留。</p>
    <div class="coverage-summary"><strong>道具 {{ propsCount }} · 关键帧 {{ frameCount }}<template v-if="sourceMaterials.length"> · 真实素材 {{ sourceMaterials.length }}</template> · {{ completed }}/{{ total }}</strong><span v-if="snapshot.running">{{ snapshot.phase }}</span></div>
    <el-progress v-if="total && !analyzing" :percentage="Math.round(completed / total * 100)" />
    <p v-if="snapshot.error || error" role="alert" class="coverage-error">{{ snapshot.error || error }}</p>
    <p v-if="!total && !analyzing">暂无镜头资产</p>
    <template v-else>
      <div class="coverage-toolbar"><label>资产类型 <select v-model="kind" aria-label="筛选镜头资产"><option value="all">全部</option><option value="prop">关键道具</option><option value="shot_frame">镜头关键帧</option><option value="source">真实素材</option></select></label><el-pagination v-model:current-page="page" :page-size="12" :total="filtered.length" layout="prev, pager, next" /></div>
      <div class="coverage-grid"><article v-for="asset in visible" :key="asset.id" class="coverage-card">
        <GeneratedAssetImage v-if="asset.imageUrl && asset.status === 'done'" :src="asset.imageUrl" :title="asset.title" :model="asset.model" :prediction-id="asset.predictionId" />
        <div v-else class="coverage-placeholder">{{ labels[asset.status] || asset.status }}</div>
        <strong>{{ asset.title }}</strong><span>{{ asset.kind === 'source' ? (asset.status === 'done' ? '已绑定原始素材' : '待上传') : (labels[asset.status] || asset.status) }}</span>
        <p v-if="asset.errorMessage" class="coverage-error">{{ asset.errorMessage }}</p>
        <details><summary>{{ asset.kind === 'source' ? '素材文件' : '生成依据' }}</summary><p>{{ asset.prompt }}</p><small>{{ asset.model }}</small></details>
        <el-button v-if="asset.kind === 'shot_frame'" size="small" :disabled="snapshot.outdated || snapshot.running || requesting" @click="editing = asset; revisedPrompt = asset.prompt">修正构图</el-button>
        <el-button v-if="asset.storyboardId" size="small" text @click="emit('select', asset.storyboardId)">查看对应分镜</el-button>
      </article></div>
    </template>
    <el-dialog :model-value="!!editing" title="修正本镜关键帧" width="min(720px,94vw)" :close-on-click-modal="!requesting" :show-close="!requesting" @close="editing = null">
      <p>{{ editing?.title }}。保留人物、场景和道具参考，只重新生成这张图。</p>
      <el-input v-model="revisedPrompt" type="textarea" :rows="10" maxlength="12000" aria-label="修正关键帧描述" />
      <p v-if="error" role="alert" class="coverage-error">{{ error }}</p>
      <template #footer><el-button :disabled="requesting" @click="editing = null">取消</el-button><el-button type="primary" :loading="requesting" @click="revise">保存并重生本图</el-button></template>
    </el-dialog>
  </section>
</template>
<style scoped>
.coverage { padding: 20px; margin-bottom: 20px; border: 1px solid #d4dfed; border-radius: 12px; background: #f6f9fd; color: #334155; }
.coverage-title { display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; }.coverage-title h3 { margin:0; font-size:17px; }.coverage-title p { max-width:680px; font-size:13px; line-height:1.7; }
.coverage-actions { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }.coverage-actions .el-button { margin:0; }.coverage-summary { display:flex; flex-wrap:wrap; gap:16px; margin:12px 0; font-size:13px; }.coverage-toolbar { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; margin:16px 0; font-size:13px; }.coverage-toolbar select { padding:6px; border:1px solid #cbd5e1; border-radius:6px; background:white; }
.coverage-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:14px; }.coverage-card { padding:12px; border:1px solid #e2e8f0; border-radius:8px; background:white; display:flex; flex-direction:column; gap:8px; min-width:0; }.coverage-card .el-image,.coverage-placeholder { width:100%; height:145px; background:#eaf0f8; border-radius:6px; }.coverage-placeholder { display:grid; place-items:center; color:#64748b; }.coverage-card strong { font-size:13px; }.coverage-card span,.coverage-card details { font-size:12px; line-height:1.6; }.coverage-card details p { white-space:pre-wrap; max-height:180px; overflow:auto; }.coverage-error { color:#b42318; font-size:12px; overflow-wrap:anywhere; }
</style>
