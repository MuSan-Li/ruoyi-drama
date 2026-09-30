<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { get } from '@/utils/request';
import GeneratedAssetImage from './GeneratedAssetImage.vue';
const props = defineProps<{ projectId: string; storyboardId: string }>();
const assets = ref<Array<{ storyboardId?: string; imageUrl?: string; model?: string; predictionId?: string; status: string; title: string }>>([]);
const error = ref('');
let version = 0;
const selected = computed(() => assets.value.find(a => String(a.storyboardId) === String(props.storyboardId)));
watch(() => props.projectId, async () => {
  const current = ++version;
  assets.value = []; error.value = '';
  try {
    const response: any = await get(`/short-drama/${props.projectId}/visual-assets`).json();
    if (current !== version) return;
    const data = response.data || response;
    if (!Array.isArray(data.assets)) throw new Error(response.msg || '镜头资产读取失败');
    assets.value = data.assets;
  } catch(e: any) { if (current === version) error.value = e.message || '镜头资产读取失败'; }
}, { immediate: true });
onUnmounted(() => { version++; });
</script>
<template>
  <section class="frame-preview" aria-label="本镜起始关键帧">
    <strong>本镜起始关键帧</strong>
    <GeneratedAssetImage v-if="selected?.status === 'done' && selected.imageUrl" :src="selected.imageUrl" :title="selected.title" :model="selected.model" :prediction-id="selected.predictionId" style="--asset-image-height:auto" />
    <p v-if="selected?.status !== 'done'">{{ error || '暂无关键帧' }}</p>
  </section>
</template>
<style scoped>
.frame-preview { display:flex; flex-direction:column; gap:10px; margin:16px 0; padding:16px; border:1px solid #d7e3ef; border-radius:10px; background:#f8fafc; }
.frame-preview strong { font-size:14px; }.frame-preview .el-image { width:100%; max-height:360px; background:#eaf0f8; }.frame-preview p { margin:0; color:#64748b; font-size:12px; line-height:1.6; }
</style>
