<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from '@/utils/message';
import { applyShortDramaRevision } from '@/api/shortDrama';
import type { ShortDramaStoryboard } from '@/api/shortDrama/types';
import { reviewShot } from '../shotReview';
const props = defineProps<{ projectId: string; shots: ShortDramaStoryboard[]; scriptText: string }>();
const emit = defineEmits<{ applied: [] }>();
const draft = ref<any>(null);
const error = ref('');
const busy = ref(false);
const show = ref(false);
const seconds = computed(() => (draft.value?.storyboards || []).reduce((n: number, s: ShortDramaStoryboard) => n + (s.durationSeconds || 0), 0));
async function readFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  error.value = ''; draft.value = null;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('修订稿不得超过5MB');
    const data = JSON.parse(await file.text());
    if (data.expectedScriptText !== props.scriptText) throw new Error('剧本已变化，请以当前版本重新制作修订稿');
    if (!Array.isArray(data.storyboards) || data.storyboards.length !== props.shots.length) throw new Error('必须包含当前项目全部镜头');
    const ids = new Set(props.shots.map(s => s.id));
    if (new Set(data.storyboards.map((s: ShortDramaStoryboard) => s.id)).size !== ids.size) throw new Error('镜头ID重复');
    for (const s of data.storyboards as ShortDramaStoryboard[]) {
      if (!ids.has(s.id) || s.projectId !== props.projectId) throw new Error('镜头不属于当前项目');
      const r = reviewShot(s);
      if (r.overflow) throw new Error(`镜头${s.sceneNo}超时：至少${r.required}秒`);
    }
    draft.value = data; show.value = true;
  } catch(e: any) { error.value = e.message; }
  input.value = '';
}
async function apply() {
  busy.value = true;
  try { await applyShortDramaRevision(props.projectId, draft.value); ElMessage.success('剧本、资产说明与分镜修订已一起保存'); show.value = false; draft.value = null; emit('applied'); }
  catch(e: any) { error.value = e.message || '保存失败，未完成修订'; }
  finally { busy.value = false; }
}
</script>
<template>
  <div class="revision-import"><label class="revision-upload">导入审阅修订稿<input type="file" accept="application/json,.json" aria-label="导入审阅修订稿" :disabled="busy" @change="readFile"></label><span v-if="error" role="alert">{{ error }}</span>
    <el-dialog v-model="show" title="审阅修订稿" width="min(640px, 94vw)" :close-on-click-modal="!busy" :show-close="!busy">
      <p>将同步保存当前剧本、{{ draft?.storyboards.length }} 个镜头及随稿资产说明。保留已有图片，本操作不生成视频。</p>
      <p>修订后预计 {{ Math.floor(seconds / 60) }} 分 {{ seconds % 60 }} 秒。</p>
      <pre class="revision-note">{{ draft?.summary || '请核对修订内容后保存。' }}</pre>
      <p v-if="error" role="alert">{{ error }}</p>
      <template #footer><el-button :disabled="busy" @click="show = false">取消</el-button><el-button type="primary" :loading="busy" @click="apply">保存整份修订稿</el-button></template>
    </el-dialog>
  </div>
</template>
<style scoped>
.revision-import { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; font-size: 12px; }.revision-upload { cursor: pointer; padding: 8px 12px; border: 1px solid #cbd5e1; background: white; color: #334155; border-radius: 6px; }.revision-upload input { display: none; }.revision-import span { color: #b45309; }.revision-note { white-space: pre-wrap; margin: 16px 0; font: inherit; line-height: 1.8; background: #f6f8fc; padding: 16px; }.revision-import p { line-height: 1.8; }
</style>
