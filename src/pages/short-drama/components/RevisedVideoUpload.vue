<script setup lang="ts">
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { shallowRef } from 'vue';
import { useUserStore } from '@/stores';
const props = defineProps<{ projectId: string; storyboardId: string; videoId?: string; disabled?: boolean }>();
const emit = defineEmits<{ uploaded: [] }>();
const busy = shallowRef(false);
const error = shallowRef('');
async function upload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || busy.value || props.disabled) return;
  busy.value = true;
  error.value = '';
  try {
    if (file.size > 19 * 1024 * 1024) throw new Error('请选择19MB以内的视频');
    const body = new FormData();
    body.append('file', file);
    body.append('expectedVideoId', props.videoId || '');
    const base = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const response = await authenticatedFetch(`${base}/short-drama/${props.projectId}/materials/${props.storyboardId}/video`, {
      method: 'POST', body,
      headers: { authorization: `Bearer ${useUserStore().token}`, ClientID: import.meta.env.VITE_CLIENT_ID },
    });
    const result = await response.json();
    if (!response.ok || result.code !== 200) throw new Error(result.msg || '视频导入失败');
    emit('uploaded');
  } catch (e) {
    error.value = e instanceof Error ? e.message : '视频导入失败';
  } finally { busy.value = false; input.value = ''; }
}
</script>
<template>
  <div class="revised-video">
    <label class="upload-label">{{ busy ? '导入中…' : '导入修订视频' }}<input type="file" accept="video/mp4,video/quicktime" :disabled="busy || disabled" aria-label="导入修订视频" @change="upload"></label>
    <span v-if="error" class="upload-error" role="alert">{{ error }}</span>
  </div>
</template>
<style scoped>
.revised-video{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.upload-label{display:inline-flex;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;background:white;font-size:12px;cursor:pointer}.upload-label:has(input:disabled){opacity:.5;cursor:wait}.upload-label input{display:none}.upload-error{color:#c24136;font-size:12px}
</style>
