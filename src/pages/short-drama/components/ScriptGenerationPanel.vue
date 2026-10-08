<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue';
import type { ScriptCreationJob } from '@/utils/scriptCreationProgress';
import ScriptReader from './ScriptReader.vue';

const props = defineProps<{ job: ScriptCreationJob }>();
const now = ref(Date.now());
const timer = setInterval(() => { now.value = Date.now(); }, 1000);
onScopeDispose(() => clearInterval(timer));
const elapsed = computed(() => Math.max(0, Math.floor(((props.job.endedAt || now.value) - props.job.startedAt) / 1000)));
const silence = computed(() => props.job.progress?.lastActivityAt ? Math.max(0, Math.floor((now.value - props.job.progress.lastActivityAt) / 1000)) : null);
const stalled = computed(() => props.job.state === 'running' && (silence.value ?? elapsed.value) >= 30);
</script>

<template>
  <section class="script-generation-panel" aria-live="polite" :aria-busy="job.state === 'running'">
    <div class="generation-heading">
      <div><h2>{{ job.state === 'error' ? '剧本生成未完成' : job.state === 'done' ? '初版剧本已保存' : '正在生成初版剧本' }}</h2><p>{{ job.message }}</p></div>
      <span class="elapsed">已用 {{ Math.floor(elapsed / 60) }} 分 {{ elapsed % 60 }} 秒</span>
    </div>
    <div class="generation-metrics">
      <span>正文 {{ job.text.trim().length }} 字</span>
      <span v-if="job.state === 'running'">{{ silence === null ? '等待模型首次输出' : `最近输出 ${silence} 秒前` }}</span>
    </div>
    <p v-if="stalled" class="generation-delay">等待模型返回</p>
    <div class="script-paper"><ScriptReader v-if="job.text" :text="job.text" /><div v-else class="script-placeholder"><span class="pulse"></span><i></i><i></i><i></i><i></i></div></div>
  </section>
</template>

<style scoped lang="scss">
.script-generation-panel { padding: 28px; border: 1px solid #dce5f3; border-radius: 18px; background: #fff; box-shadow: 0 12px 36px rgb(31 55 93 / 5%); }
.generation-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; h2 { margin: 7px 0 10px; font-size: 23px; } p { margin: 0; color: #69768b; } }
.section-kicker { color: #487aeb; font-size: 12px; font-weight: 600; letter-spacing: .08em; }
.elapsed { white-space: nowrap; border-radius: 9px; padding: 9px 13px; background: #edf4ff; color: #3569d8; font-variant-numeric: tabular-nums; }
.generation-metrics { display: flex; flex-wrap: wrap; gap: 10px 24px; padding: 20px 0; color: #65738b; font-size: 13px; font-variant-numeric: tabular-nums; }
.generation-delay { margin: 0 0 16px; padding: 12px; color: #946414; background: #fff8e8; border-radius: 8px; }
.script-paper { min-height: 330px; border: 1px solid #e1e8f2; border-radius: 12px; background: #fcfdff; padding: 25px; pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; line-height: 1.9; color: #34445d; } }
.script-placeholder { color: #8490a3; i { display: block; height: 12px; margin: 27px 0; border-radius: 5px; background: #edf1f7; &:nth-last-child(1) { width: 65%; } &:nth-last-child(2) { width: 90%; } } }
.pulse { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: #5386ee; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .3; } }
@media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
@media (max-width: 700px) { .script-generation-panel { padding: 18px; } .generation-heading { flex-wrap: wrap; } }
</style>
