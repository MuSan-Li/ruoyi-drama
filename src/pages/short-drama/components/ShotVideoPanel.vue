<script setup lang="ts">
import { computed } from 'vue';
import type { ShortDramaStoryboard } from '@/api/shortDrama/types';
import StudioBadge from '@/components/studio/StudioBadge.vue';
import LocalVideoPreview from './LocalVideoPreview.vue';

const props = defineProps<{
  shot: ShortDramaStoryboard;
  previewSrc: string;
  blocked: boolean;
  unknown: boolean;
  hint?: string;
  canRestore?: boolean;
  disabled?: boolean;
}>();
const emit = defineEmits<{ query: []; restore: [] }>();
const status = computed(() => {
  if (props.unknown) return { label: '提交结果待确认', tone: 'warning' as const };
  if (props.shot.videoStatus === 'done') return { label: '已生成', tone: 'accent' as const };
  if (props.blocked) return { label: '生成中', tone: 'neutral' as const };
  if (props.shot.videoStatus === 'failed') return { label: '生成失败', tone: 'warning' as const };
  return { label: '待生成', tone: 'neutral' as const };
});
const playable = computed(() => props.shot.videoStatus === 'done' && !!props.shot.videoUrl);
const title = computed(() => `镜头 ${props.shot.sceneNo}${props.shot.sceneTitle ? ` · ${props.shot.sceneTitle}` : ''}`);
</script>

<template>
  <section class="shot-video-panel" aria-label="镜头视频">
    <div class="video-panel-main">
      <div class="video-panel-heading"><strong>镜头视频</strong><StudioBadge :tone="status.tone" dot>{{ status.label }}</StudioBadge></div>
      <div class="video-panel-controls">
        <LocalVideoPreview v-if="playable && previewSrc" :src="previewSrc" :title="title" />
        <a v-else-if="playable" :href="shot.videoUrl" target="_blank" rel="noopener noreferrer"><el-button type="primary" plain size="small">打开视频</el-button></a>
        <el-button v-if="blocked || hint" size="small" text @click="emit('query')">查询状态</el-button>
        <el-button v-if="canRestore" size="small" text :disabled="disabled" @click="emit('restore')">恢复同一请求</el-button>
      </div>
    </div>
    <p v-if="hint" class="video-panel-feedback" role="status">{{ hint }}</p>
    <div class="video-panel-actions"><slot name="actions" /></div>
  </section>
</template>

<style scoped>
.shot-video-panel { display:grid; grid-template-columns:minmax(0,1fr); gap:14px; padding:16px; min-width:0; border:1px solid var(--drama-border); border-radius:var(--drama-radius-md); background:var(--drama-surface-strong); }
.video-panel-main,.video-panel-heading,.video-panel-controls,.video-panel-actions { display:flex; align-items:center; flex-wrap:wrap; gap:10px; min-width:0; }
.video-panel-main { justify-content:space-between; }
.video-panel-heading strong { color:var(--drama-text); font-size:14px; font-weight:650; }
.video-panel-controls :deep(.el-button)+:deep(.el-button),.video-panel-actions :deep(.el-button)+:deep(.el-button) { margin-left:0; }
.video-panel-controls a { display:inline-flex; text-decoration:none; }
.video-panel-actions { justify-content:flex-end; padding-top:14px; border-top:1px solid var(--drama-border-subtle); }
.video-panel-feedback { margin:0; color:var(--drama-text-secondary); overflow-wrap:anywhere; font-size:12px; line-height:1.6; }
@media(max-width:640px) { .shot-video-panel { padding:12px; }.video-panel-main { align-items:flex-start; }.video-panel-actions { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }.video-panel-actions :deep(.el-button) { width:100%; min-width:0; } }
</style>
