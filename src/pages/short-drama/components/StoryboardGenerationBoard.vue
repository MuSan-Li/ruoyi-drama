<script setup lang="ts">
import { computed, ref } from 'vue';
import { planningPending } from '@/utils/storyboardPlanningProgress';
import type { PlanningJob } from '@/utils/storyboardPlanningProgress';
import { storyboardEstimate, storyboardFailureSummary } from '@/utils/storyboardGenerationFeedback';
import VideoPromptReader from './VideoPromptReader.vue';
const props = defineProps<{ job: PlanningJob; now: number; querying: boolean; canRetry?: boolean }>();
defineEmits<{ query: []; retry: [] }>();
const dismissed = ref<string>();
const cards = computed(() => props.job.progress?.cards || []);
const planned = computed(() => cards.value.filter(card => card.stage !== 'draft').length);
const ready = computed(() => cards.value.filter(card => card.stage === 'ready').length);
const calls = computed(() => props.job.progress?.calls || []);
const activeCalls = computed(() => calls.value.filter(call => call.state === 'running'));
const pending = computed(() => planningPending(props.job));
const estimate = computed(() => storyboardEstimate(cards.value));
const failure = computed(() => storyboardFailureSummary(props.job.message));
const phase = computed(() => !pending.value ? props.job.state === 'done' ? '分镜已保存' : '未保存的规划草稿' : props.job.progress?.phase === 'storyboard_detail' ? '细化镜头' : props.job.progress?.phase === 'persist' ? '保存分镜' : '规划镜头');
const elapsed = computed(() => Math.max(0, Math.floor(((pending.value ? props.now : props.job.progress?.updatedAt || props.job.lastCheckedAt) - props.job.startedAt) / 1000)));
const heartbeatAge = computed(() => Math.max(0, Math.floor((props.now - (props.job.progress?.updatedAt || props.job.lastCheckedAt || props.job.startedAt)) / 1000)));
const placeholders = computed(() => pending.value ? cards.value.length ? 2 : 3 : 0);
function value(panel: Record<string, any>, snake: string, camel: string) { return panel[snake] || panel[camel] || ''; }
function design(panel: Record<string, any>) { return panel.shot_design || panel.shotDesign || {}; }
function activity(call: (typeof calls.value)[number]) {
  const seconds = Math.max(0, Math.floor((props.now - call.startedAt) / 1000));
  const age = Math.max(0, Math.floor((props.now - call.lastActivityAt) / 1000));
  if (call.contentChars) return `已返回 ${call.contentChars.toLocaleString()} 字 · 最近输出 ${Math.max(0, Math.floor((props.now - call.lastActivityAt) / 1000))} 秒前`;
  if (call.thinkingChars) return `已收到构思活动 · 最近模型活动 ${age} 秒前 · 等待正文 ${seconds} 秒`;
  return `等待模型首次返回 · ${seconds} 秒`;
}
</script>

<template>
  <div v-if="dismissed !== job.requestId" class="generation-board" aria-label="分镜生成进度" aria-live="polite">
    <header class="generation-heading">
      <div><span class="stage-label"><i />{{ phase }}</span><h2>{{ pending ? '分镜生成中' : job.state === 'done' ? '分镜已保存，结果读取失败' : '分镜生成已停止，未保存' }}</h2><p>已规划 {{ planned }} 镜 · 已细化 {{ ready }} 镜 · 已用时 {{ elapsed }} 秒<span v-if="estimate"> · 当前草稿预计 {{ estimate }} 秒</span></p></div>
      <div class="generation-actions"><el-button v-if="job.state === 'error'" size="small" type="primary" :disabled="!canRetry" @click="$emit('retry')">重新生成</el-button><el-button size="small" :loading="querying" @click="$emit('query')">查询进度</el-button><el-button v-if="!pending" size="small" text @click="dismissed = job.requestId">关闭提示</el-button></div>
    </header>
    <div class="generation-status" role="status">
      <p v-if="pending || job.state === 'error'">{{ pending ? job.progress?.message || job.message : failure }}</p>
      <details v-if="job.state === 'error' && job.message" class="failure-details"><summary>查看失败详情</summary><p>{{ job.message }}</p></details>
      <p v-for="call in activeCalls" :key="call.id">{{ call.label }}：{{ activity(call) }}</p>
      <p v-if="job.queryError" class="status-warning">{{ job.queryError }}</p>
      <p v-else-if="pending && heartbeatAge > 35" class="status-warning">{{ heartbeatAge }} 秒未收到进度更新，正在查询原任务状态。</p>
    </div>
    <details v-if="cards.length || pending" :open="pending" class="generation-drafts">
    <summary v-if="!pending">查看未保存草稿（{{ cards.length }} 镜）</summary>
    <div class="generation-masonry">
      <article v-for="card in cards" :key="card.key" class="generation-shot">
        <div class="shot-heading"><strong>场 {{ card.scene }} · 镜 {{ card.ordinal }}</strong><span :class="card.stage">{{ card.stage === 'ready' ? '细化完成' : card.stage === 'planned' ? '规划已校验' : '规划草稿' }}</span></div>
        <h3>{{ value(card.panel, 'scene_title', 'sceneTitle') || value(card.panel, 'segment_goal', 'segmentGoal') || value(card.panel, 'location', 'locationName') || '镜头规划' }}</h3>
        <p v-if="design(card.panel).focus" class="shot-focus">{{ design(card.panel).focus }}</p>
        <p>{{ value(card.panel, 'description', 'sceneText') }}</p>
        <dl v-if="design(card.panel).framing"><dt>构图与拍法</dt><dd>{{ design(card.panel).framing }} · {{ design(card.panel).movement }}</dd></dl>
        <dl v-if="design(card.panel).cut_in"><dt>接镜</dt><dd>{{ design(card.panel).cut_in }}</dd><dt>交镜</dt><dd>{{ design(card.panel).cut_out }}</dd></dl>
        <dl v-if="value(card.panel, 'video_prompt', 'videoPrompt')"><dt>视频提示词</dt><dd><VideoPromptReader :text="value(card.panel, 'video_prompt', 'videoPrompt')" compact /></dd></dl>
      </article>
      <article v-for="n in placeholders" :key="`waiting:${n}`" class="generation-shot placeholder" aria-label="镜头生成占位">
        <div class="skeleton short" /><div class="skeleton canvas" /><div class="skeleton" /><div class="skeleton" /><div class="skeleton medium" />
      </article>
    </div>
    </details>
  </div>
</template>

<style scoped>
.generation-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
.generation-actions { display: flex; flex-wrap: wrap; gap: 8px; }.generation-actions .el-button { margin-left: 0; }
.generation-drafts > summary, .failure-details > summary { cursor: pointer; color: #52647d; font-size: 13px; padding: 8px 0; }.generation-drafts[open] > summary { margin-bottom: 12px; }.failure-details p { overflow-wrap: anywhere; }
.stage-label { display: flex; align-items: center; gap: 7px; color: #3568e8; font-size: 12px; margin-bottom: 8px; }.stage-label i { width: 7px; height: 7px; background: #4d7aef; border-radius: 50%; }
h2 { margin: 0; font-size: 21px; }h3 { margin: 14px 0 8px; font-size: 16px; }p { margin: 7px 0 0; color: #64748b; font-size: 13px; line-height: 1.75; }
.generation-status { border-radius: 10px; padding: 10px 16px; margin-bottom: 22px; background: #f2f6fd; }.generation-status p:first-child { color: #334155; }.generation-status .status-warning { color: #ad6612; }
.generation-masonry { columns: 3 290px; column-gap: 18px; }.generation-shot { break-inside: avoid; border: 1px solid #e0e7f1; border-radius: 12px; padding: 18px; margin-bottom: 18px; background: white; overflow-wrap: anywhere; }
.shot-heading { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; }.shot-heading span { font-size: 11px; padding: 3px 7px; border-radius: 5px; color: #67758a; background: #f0f3f7; }.shot-heading .ready { color: #158258; background: #eaf8ef; }.shot-heading .planned { color: #3568e8; background: #eff4ff; }.shot-focus { color: #1e293b; font-weight: 600; }
dl { margin: 16px 0 0; font-size: 12px; line-height: 1.8; }dt { color: #7a8799; margin-top: 8px; }dd { margin: 0; color: #475569; white-space: pre-wrap; }.draft-note { display: inline-block; margin-top: 16px; color: #8a95a6; font-size: 11px; }
.placeholder { padding-bottom: 26px; }.placeholder:nth-last-child(2) { padding-bottom: 70px; }.skeleton { height: 10px; margin: 12px 0; border-radius: 6px; background: linear-gradient(100deg,#f1f4f9 20%,#e7edf7 45%,#f1f4f9 70%); background-size: 250% 100%; animation: shimmer 2s ease infinite; }.skeleton.short { width: 35%; }.skeleton.medium { width: 70%; }.skeleton.canvas { height: 150px; margin: 22px 0; border-radius: 8px; }
@keyframes shimmer { to { background-position: -150% 0; } }@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }
</style>
