<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue';

const props = withDefaults(defineProps<{
  thinkingText: string;
  text: string;
  textLabel?: string;
}>(), { textLabel: '剧本正文' });

const thinkingOutput = useTemplateRef<HTMLDivElement>('thinkingOutput');
const textOutput = useTemplateRef<HTMLDivElement>('textOutput');
const elapsedSeconds = shallowRef(0);
const startedAt = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  timer = setInterval(() => { elapsedSeconds.value = Math.floor((Date.now() - startedAt) / 1000); }, 1000);
});
onUnmounted(() => clearInterval(timer));

watch(() => props.thinkingText, () => {
  const element = thinkingOutput.value;
  if (element) element.scrollTop = element.scrollHeight;
}, { flush: 'post' });
watch(() => props.text, () => {
  const element = textOutput.value;
  if (element) element.scrollTop = element.scrollHeight;
}, { flush: 'post' });
</script>

<template>
  <div class="generation-stream-output">
    <p v-if="!thinkingText && !text" class="stream-waiting" role="status">
      等待模型返回 · {{ elapsedSeconds }} 秒
    </p>
    <details v-if="thinkingText" class="thinking-stream" :open="!text">
      <summary>创作过程<span v-if="!text"> · 实时输出中</span></summary>
      <div ref="thinkingOutput" class="stream-text thinking-text"><pre>{{ thinkingText }}</pre></div>
    </details>
    <div v-if="text" class="script-stream">
      <div class="stream-label">{{ textLabel }} · 实时输出</div>
      <div ref="textOutput" class="stream-text sse-stream-text"><pre>{{ text }}</pre></div>
    </div>
  </div>
</template>

<style scoped>
.generation-stream-output { width: 100%; margin-bottom: 14px; text-align: left; }
.stream-waiting { margin: 8px 0; color: #64748b; font-size: 13px; line-height: 1.6; text-align: center; }
.thinking-stream { margin-bottom: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
.thinking-stream summary { padding: 10px 14px; color: #64748b; font-size: 13px; cursor: pointer; }
.stream-label { margin-bottom: 8px; color: #334155; font-size: 13px; font-weight: 600; }
.stream-text { max-height: 360px; overflow-y: auto; padding: 14px 16px; background: #fafbfc; border: 1px solid #e8ecf1; border-radius: 8px; }
.thinking-text { max-height: 180px; padding-top: 4px; border: 0; background: transparent; }
.stream-text pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; color: #334155; font-family: inherit; font-size: 14px; line-height: 1.8; }
.thinking-text pre { color: #64748b; font-size: 13px; line-height: 1.7; }
</style>
