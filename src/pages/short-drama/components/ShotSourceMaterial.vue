<script setup lang="ts">
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { requestErrorMessage } from '@/utils/requestFeedback';
import { computed, shallowRef } from 'vue';
import { useUserStore } from '@/stores';
import GeneratedAssetImage from './GeneratedAssetImage.vue';
const props=defineProps<{ projectId:string; storyboardId:string; continuityJson?:string }>();
const emit=defineEmits<{ uploaded:[] }>();
const busy=shallowRef(false), error=shallowRef('');
const media=computed(()=>{try{return JSON.parse(props.continuityJson || '{}').source_media || {};}catch{return {};}});
interface SourceImage { url:string; filename?:string; label?:string; usage?:string }
const images=computed<SourceImage[]>(()=>Array.isArray(media.value.items) && media.value.items.length ? media.value.items : (media.value.url ? [media.value] : []));
async function request(method: string, body?: FormData, query = '') {
  const base = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const response = await authenticatedFetch(`${base}/short-drama/${props.projectId}/materials/${props.storyboardId}${query}`, {
    method, headers: { authorization: `Bearer ${useUserStore().token}`, ClientID: import.meta.env.VITE_CLIENT_ID }, body,
  });
  const result = await response.json();
  if (!response.ok || result.code !== 200) throw new Error(result.msg || '素材保存失败');
  emit('uploaded');
}
async function upload(event: Event, replaceUrl?: string) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  if (!files.length || busy.value) return;
  busy.value = true; error.value = '';
  try {
    if (!replaceUrl && images.value.length + files.length > 20) throw new Error('每个镜头最多20张素材');
    if (files.some(file => !['image/png', 'image/jpeg'].includes(file.type) || file.size > 10 * 1024 * 1024))
      throw new Error('请选择10MB以内的PNG或JPEG图片');
    if (files.reduce((sum, file) => sum + file.size, 0) > 19 * 1024 * 1024) throw new Error('本次素材总计超过19MB，请分批添加');
    const form = new FormData();
    files.forEach(file => form.append('file', file));
    await request('POST', form, replaceUrl ? `?replaceUrl=${encodeURIComponent(replaceUrl)}` : '');
  } catch (e: unknown) { error.value = requestErrorMessage(e, '素材保存失败'); }
  finally { busy.value = false; input.value = ''; }
}
async function renderClip() {
  busy.value=true;error.value='';
  try {
    const base=String(import.meta.env.VITE_API_URL || '').replace(/\/$/,'');
    const response=await authenticatedFetch(`${base}/short-drama/${props.projectId}/materials/${props.storyboardId}/render`,{method:'POST',headers:{authorization:`Bearer ${useUserStore().token}`,ClientID:import.meta.env.VITE_CLIENT_ID}});
    const result=await response.json();if(result.code!==200)throw new Error(result.msg || '合成失败');emit('uploaded');
  } catch(e){error.value=requestErrorMessage(e, '素材片段合成失败');}finally{busy.value=false;}
}
async function remove(url: string) {
  if (busy.value) return;
  busy.value = true; error.value = '';
  try { await request('DELETE', undefined, `?url=${encodeURIComponent(url)}`); }
  catch (e: unknown) { error.value = requestErrorMessage(e, '素材移除失败'); }
  finally { busy.value = false; }
}
</script>
<template>
  <section v-if="media.mode==='direct_insert'" class="source-material" aria-label="素材">
    <div class="source-head"><strong>素材</strong><el-button size="small" :loading="busy" :disabled="!images.length" @click="renderClip">生成素材片段</el-button><span>{{ images.length }} 张</span><label class="source-upload">{{ busy ? '处理中…' : '添加素材' }}<input type="file" accept="image/png,image/jpeg" multiple :disabled="busy" aria-label="添加素材（可多选）" @change="upload($event)"></label></div>
    <div v-if="images.length" class="source-images">
      <figure v-for="(image, index) in images" :key="image.url">
        <figcaption v-if="images.length > 1">{{ index + 1 }}. {{ image.label || image.filename }}</figcaption>
        <GeneratedAssetImage :src="image.url" :title="image.label || image.filename || '真实界面素材'" style="--asset-image-height:auto" />
        <p v-if="image.usage">{{ image.usage }}</p>
        <div class="image-actions">
          <label class="source-upload">更换<input type="file" accept="image/png,image/jpeg" :disabled="busy" :aria-label="`更换第${index + 1}张素材`" @change="upload($event, image.url)"></label>
          <el-button size="small" text :disabled="busy" :aria-label="`移除第${index + 1}张素材`" @click="remove(image.url)">移除</el-button>
        </div>
      </figure>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
  </section>
  <div v-else class="material-options" aria-label="素材">
    <strong>素材</strong>
    <label class="source-upload">{{ busy ? '上传中…' : '上传素材' }}<input type="file" accept="image/png,image/jpeg" multiple :disabled="busy" aria-label="添加素材（可多选）" @change="upload($event)"></label>
    <span v-if="error" role="alert">{{ error }}</span>
  </div>
</template>
<style scoped>
.image-actions{display:flex;align-items:center;gap:8px;margin-top:8px}.source-upload:has(input:disabled){opacity:.5;cursor:wait}
.source-images{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px}.source-images figure{margin:0;min-width:0}.source-images figcaption{font-size:13px;font-weight:600;margin-bottom:8px}.source-images p{line-height:1.6}
.source-material{border:1px solid #d8e3ef;border-radius:10px;padding:16px;background:#f8fafc;min-width:0}.source-head{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px}.source-head span{font-size:12px;color:#64748b;overflow-wrap:anywhere;flex:1}.source-upload{display:inline-flex;padding:7px 12px;border:1px solid #cbd5e1;background:white;border-radius:6px;font-size:12px;cursor:pointer}.source-upload input{display:none}.material-options{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;color:#64748b}.material-options strong{color:#64748b;font-size:12px}.source-material p{font-size:13px;color:#64748b}
</style>
