<script setup lang="ts">
import { computed, ref } from 'vue';
import { planningPending, type PlanningJob } from '@/utils/storyboardPlanningProgress';
const props = defineProps<{ job: PlanningJob; now: number; querying: boolean }>();
defineEmits<{ query: [] }>();
const dismissed = ref<string>();
const pending = computed(() => planningPending(props.job));
const cards = computed(() => props.job.progress?.cards || []);
const calls = computed(() => props.job.progress?.calls || []);
const elapsed = computed(() => Math.max(0, Math.floor(((pending.value ? props.now : props.job.progress?.updatedAt || props.job.lastCheckedAt) - props.job.startedAt) / 1000)));
const categories = ['角色', '场景', '道具'];
const counts = computed(() => categories.map((_, index) => cards.value.filter(card => card.scene === index + 1).length));
const heartbeatAge = computed(() => Math.max(0, Math.floor((props.now - (props.job.progress?.updatedAt || props.job.lastCheckedAt || props.job.startedAt)) / 1000)));
</script>

<template>
  <div v-if="dismissed !== job.requestId" class="asset-generation" aria-label="资产分析进度" aria-live="polite">
    <header>
      <div><span class="phase">{{ job.progress?.phase === 'persist' ? '正在保存' : '分析资产' }}</span><h2>{{ pending ? '资产分析中' : job.state === 'done' ? '资产已保存，结果读取失败' : '资产分析未完成' }}</h2><p>角色 {{ counts[0] }} · 场景 {{ counts[1] }} · 道具 {{ counts[2] }} · 已用时 {{ elapsed }} 秒</p></div>
      <div><el-button size="small" :loading="querying" @click="$emit('query')">查询进度</el-button><el-button v-if="!pending" size="small" text @click="dismissed = job.requestId">关闭提示</el-button></div>
    </header>
    <div class="status" role="status">
      <p>{{ pending ? job.progress?.message || job.message : job.message }}</p>
      <p v-for="call in calls.filter(entry => entry.state === 'running')" :key="call.id">{{ call.contentChars ? `已返回 ${call.contentChars.toLocaleString()} 字 · 最近输出 ${Math.max(0, Math.floor((now - call.lastActivityAt) / 1000))} 秒前` : `等待模型首次返回 · ${Math.max(0, Math.floor((now - call.startedAt) / 1000))} 秒` }}</p>
      <p v-if="job.queryError" class="warning">{{ job.queryError }}</p>
      <p v-else-if="pending && heartbeatAge > 35" class="warning">{{ heartbeatAge }} 秒未收到进度更新，正在查询原任务状态。</p>
    </div>
    <div class="cards">
      <article v-for="card in cards" :key="card.key"><div class="card-heading"><span>{{ categories[card.scene - 1] }}</span><small>{{ card.stage === 'ready' ? '已核对' : '分析草稿' }}</small></div><h3>{{ card.panel.name }}</h3><p>{{ card.panel.visualDescription || card.panel.description || card.panel.summary || card.panel.introduction }}</p></article>
      <article v-for="(category, index) in pending ? categories : []" :key="`placeholder:${index}`" class="placeholder"><span>{{ category }}</span><div class="skeleton canvas" /><div class="skeleton" /><div class="skeleton short" /></article>
    </div>
  </div>
</template>

<style scoped>
.asset-generation { margin-bottom: 28px; }header,.card-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; }header { margin-bottom: 16px; }.phase { color: #3568e8; font-size: 12px; }h2 { font-size: 21px; margin: 8px 0; }h3 { margin: 16px 0 8px; font-size: 16px; }p { margin: 7px 0 0; font-size: 13px; line-height: 1.8; color: #64748b; white-space: pre-wrap; overflow-wrap: anywhere; }.status { padding: 12px 16px; margin-bottom: 20px; border-radius: 10px; background: #f2f6fd; }.status p:first-child { color: #334155; }.warning { color: #ad6612; }.cards { columns: 3 270px; column-gap: 18px; }article { break-inside: avoid; padding: 18px; margin-bottom: 18px; border: 1px solid #e0e7f1; border-radius: 12px; background: white; }.card-heading span,.placeholder>span { font-size: 13px; color: #3568e8; }small { color: #7a8799; font-size: 11px; }.skeleton { margin: 14px 0; height: 10px; border-radius: 6px; background: linear-gradient(100deg,#f1f4f9 20%,#e7edf7 45%,#f1f4f9 70%); background-size: 250% 100%; animation: shimmer 2s ease infinite; }.canvas { height: 100px; margin: 20px 0; }.short { width: 65%; }@keyframes shimmer { to { background-position: -150% 0; } }@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }
</style>
