<script setup lang="ts">
import { computed } from 'vue';
import { videoPromptParagraphs, videoPromptSpans } from '@/utils/videoPromptFormatting';

const props = defineProps<{ text?: string; compact?: boolean }>();
const paragraphs = computed(() => videoPromptParagraphs(props.text).map(paragraph => ({
  ...paragraph, spans: videoPromptSpans(paragraph.text),
})));
</script>

<template>
  <article class="video-prompt-reader" :class="{ 'is-compact': compact }" aria-label="视频提示词阅读">
    <div class="prompt-prose">
      <template v-for="(paragraph, index) in paragraphs" :key="index">
        <h4 v-if="paragraph.kind === 'heading'" class="prompt-section-title">{{ paragraph.text }}</h4>
        <p v-else class="prompt-paragraph"><span v-for="(span, spanIndex) in paragraph.spans" :key="spanIndex" :class="`prompt-${span.kind}`">{{ span.text }}</span></p>
      </template>
      <p v-if="!paragraphs.length" class="prompt-empty">还没有视频提示词，点击“编辑”开始填写。</p>
    </div>
  </article>
</template>

<style scoped>
.video-prompt-reader {
  padding: 25px 28px;
  color: var(--drama-text, #263449);
  background: var(--drama-surface, #fff);
  font-size: 15px;
  line-height: 2;
  overflow-wrap: anywhere;
  text-align: left;
}
.prompt-prose { max-width: 76ch; margin-inline: auto; }
.prompt-paragraph { margin: 0 0 1.25em; white-space: pre-wrap; }
.prompt-paragraph:last-child { margin-bottom: 0; }
.prompt-section-title {
  margin: 1.6em 0 .9em;
  padding-left: 12px;
  border-left: 3px solid var(--drama-primary, #3268e8);
  color: var(--drama-text, #263449);
  font-size: 14px;
  font-weight: 650;
  line-height: 1.7;
}
.prompt-section-title:first-child { margin-top: 0; }
.prompt-quote { color: var(--drama-primary, #3268e8); font-weight: 550; }
.prompt-reference { padding: 1px 4px; border-radius: 4px; color: #5b6783; background: #f0f3f8; font-size: .88em; }
.prompt-empty { color: var(--drama-text-tertiary, #8490a3); font-size: 13px; }
.is-compact { padding: 12px 0; font-size: 13px; line-height: 1.9; }
@media (max-width: 700px) { .video-prompt-reader { padding: 20px; font-size: 14px; }.is-compact { padding: 10px 0; font-size: 13px; } }
</style>
