<script setup lang="ts">
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { shallowRef, onUnmounted, watch } from 'vue';
import { Download, VideoPlay } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores';
const props = withDefaults(defineProps<{ src: string; title?: string }>(), { title: '镜头视频' });
const url = shallowRef(''), error = shallowRef(''), busy = shallowRef(false), open = shallowRef(false);
let version = 0;
let request: AbortController | undefined;
function clear() { request?.abort(); if (url.value) URL.revokeObjectURL(url.value); url.value = ''; }
watch(() => props.src, () => { version++; clear(); error.value = ''; busy.value = false; open.value = false; });
async function load() {
  if (busy.value || url.value) return;
  const current = ++version;
  const controller = new AbortController();
  request = controller; busy.value = true; error.value = '';
  try {
    const base = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const response = await authenticatedFetch(base + props.src, { signal: controller.signal, headers: { authorization: `Bearer ${useUserStore().token}`, ClientID: import.meta.env.VITE_CLIENT_ID } });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('video/')) throw new Error('视频暂未读取，请重试');
    const blob = await response.blob();
    if (current !== version) return;
    url.value = URL.createObjectURL(blob);
  } catch (failure) {
    if (current === version && !controller.signal.aborted) error.value = failure instanceof Error ? failure.message : '视频读取失败';
  } finally { if (current === version) busy.value = false; }
}
function show() { open.value = true; void load(); }
function close() { if (busy.value) { version++; request?.abort(); busy.value = false; } }
onUnmounted(() => { version++; clear(); });
</script>

<template>
  <div class="local-video-preview">
    <el-button type="primary" plain size="small" :icon="VideoPlay" @click="show">播放视频</el-button>
    <el-dialog v-model="open" :title="title" width="min(1040px, 94vw)" class="shot-player-dialog" align-center append-to-body destroy-on-close @close="close">
      <div class="player-stage" :aria-busy="busy">
        <video v-if="open && url" :src="url" controls autoplay playsinline :aria-label="title" @error="error = '视频播放失败，请重试读取'" />
        <div v-else class="player-state" role="status">
          <span>{{ busy ? '正在读取视频…' : error || '视频暂未读取' }}</span>
          <el-button v-if="!busy" size="small" @click="load">重试读取</el-button>
        </div>
      </div>
      <p v-if="error && url" class="player-error" role="alert">{{ error }}</p>
      <template #footer>
        <el-button @click="open = false">关闭</el-button>
        <a v-if="url" :href="url" :download="`${title}.mp4`" class="player-download"><el-button type="primary" :icon="Download">下载视频</el-button></a>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.local-video-preview { display:inline-flex; }
.player-stage { display:grid; place-items:center; width:100%; min-width:0; aspect-ratio:16/9; max-height:calc(100dvh - 190px); overflow:hidden; border-radius:var(--drama-radius-md); background:#111827; }
.player-stage video { display:block; width:100%; max-height:calc(100dvh - 190px); object-fit:contain; }
.player-state { display:grid; justify-items:center; gap:16px; padding:24px; color:#dbe5f4; font-size:13px; }
.player-error { margin:12px 0 0; color:var(--drama-danger); font-size:13px; }
.player-download { display:inline-flex; margin-left:12px; text-decoration:none; }
@media(max-width:640px) { .player-stage video { max-height:60vh; }.player-download { margin-left:8px; } }
</style>
