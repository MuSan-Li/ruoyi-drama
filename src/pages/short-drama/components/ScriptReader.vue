<script setup lang="ts">
import { computed } from 'vue';
import { scriptParagraphs } from '@/utils/scriptFormatting';

const props = defineProps<{ text?: string }>();
const paragraphs = computed(() => scriptParagraphs(props.text));
</script>

<template>
  <article class="script-reader" aria-label="剧本阅读">
    <template v-for="(paragraph, index) in paragraphs" :key="index">
      <h2 v-if="paragraph.kind === 'title'" class="script-title">{{ paragraph.text }}</h2>
      <h3 v-else-if="paragraph.kind === 'scene'" class="script-scene">{{ paragraph.text }}</h3>
      <p v-else-if="paragraph.kind === 'dialogue'" class="script-dialogue"><strong>{{ paragraph.speaker }}：</strong>{{ paragraph.speech }}</p>
      <p v-else class="script-action">{{ paragraph.text }}</p>
    </template>
    <p v-if="!paragraphs.length" class="script-empty">剧本生成后将在这里显示。</p>
  </article>
</template>

<style scoped>
.script-reader { width: 100%; box-sizing: border-box; padding: 28px 32px; border: 1px solid #dfe5ed; border-radius: 12px; background: #fff; color: #34445d; font-size: 16px; line-height: 1.95; overflow-wrap: anywhere; }
.script-title { margin: 0 0 28px; color: #202d40; font-size: 22px; line-height: 1.6; }
.script-scene { margin: 32px 0 18px; padding-bottom: 10px; border-bottom: 1px solid #e8edf3; color: #263c56; font-size: 18px; }
.script-action, .script-dialogue { margin: 0 0 18px; white-space: pre-wrap; }
.script-dialogue { padding-left: 18px; border-left: 2px solid #d7e3ef; }
.script-dialogue strong { color: #253e57; }
.script-empty { color: #8490a3; }
@media (max-width: 700px) { .script-reader { padding: 20px; font-size: 15px; } }
</style>
