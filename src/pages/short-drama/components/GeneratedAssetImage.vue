<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { useUserStore } from '@/stores';
const props = defineProps<{ src: string; title: string; model?: string; predictionId?: string }>();
const displayed = ref(props.src);
const error = ref('');
const loading = ref(false);
let objectUrl = '';
let request: AbortController | undefined;
let version = 0;
function clear() { request?.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = ''; }
watch(() => [props.src,props.model,props.predictionId], () => { version++; clear(); const projectPreview=props.src.startsWith('/short-drama/') || !!(props.model && props.predictionId); displayed.value=projectPreview ? '' : props.src; error.value=''; loading.value=false; if(projectPreview) void previewFromProject(); },{immediate:true});
onUnmounted(() => { version++; clear(); });
async function previewFromProject() {
  const local=props.src.startsWith('/short-drama/');
  if ((!local && (!props.model || !props.predictionId)) || loading.value) return;
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl='';}
  const current=version; loading.value=true; error.value=''; request=new AbortController();
  try {
    const base=String(import.meta.env.VITE_API_URL || '').replace(/\/$/,'');
    const query=new URLSearchParams({ model:props.model || '', predictionId:props.predictionId || '' });
    const response=await fetch(local ? `${base}${props.src}` : `${base}/media/content?${query}`,{ signal:request.signal, headers:{ authorization:`Bearer ${useUserStore().token}`, ClientID:import.meta.env.VITE_CLIENT_ID } });
    const contentType=response.headers.get('content-type') || '';
    if (!response.ok || !contentType.startsWith('image/')) throw new Error('预览暂不可用，请重试');
    const blob=await response.blob();
    if (current!==version) return;
    objectUrl=URL.createObjectURL(blob); displayed.value=objectUrl;
  } catch(e: any) { if (current===version && e.name!=='AbortError') error.value=e.message; }
  finally { if (current===version) loading.value=false; }
}
</script>
<template>
  <div class="generated-image">
    <el-image :src="displayed" :alt="title" :preview-src-list="[displayed]" preview-teleported fit="contain" @error="previewFromProject">
      <template #error><div class="image-state"><span>{{ loading ? '加载中…' : '图片暂未加载' }}</span><el-button v-if="!loading" size="small" plain @click.stop="previewFromProject">重试预览</el-button></div></template>
    </el-image>
  </div>
</template>
<style scoped>
.generated-image { width:100%;min-width:0; }.generated-image .el-image { display:block;width:100%; aspect-ratio:16/9; height:var(--asset-image-height,145px); background:#f1f5f9; border-radius:8px; }.image-state { display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;height:100%;font-size:12px;color:#64748b; }
</style>
