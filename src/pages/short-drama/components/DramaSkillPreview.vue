<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue';
import { getShortDramaSkill } from '@/api/shortDrama/skills';
import type { ShortDramaSkillDetail } from '@/api/shortDrama/types';

const name = defineModel<string>({ default: '' });
const detail = ref<ShortDramaSkillDetail>();
const loading = shallowRef(false), error = shallowRef('');
let epoch = 0;
watch(name, async value => {
  const current = ++epoch;
  detail.value = undefined; error.value = ''; loading.value = !!value;
  if (!value) return;
  try { const result = await getShortDramaSkill(value); if (current === epoch) detail.value = result; }
  catch (failure) { if (current === epoch) error.value = failure instanceof Error ? failure.message : '风格说明读取失败'; }
  finally { if (current === epoch) loading.value = false; }
});
</script>

<template>
  <el-dialog :model-value="!!name" :title="detail?.title || '风格说明'" width="min(820px, 94vw)" append-to-body @update:model-value="value => { if (!value) name = ''; }">
    <p v-if="loading">正在读取说明…</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <template v-if="detail">
      <p class="preview-description">{{ detail.description }}</p>
      <pre class="preview-body">{{ detail.body }}</pre>
      <details v-for="file in detail.files" :key="file.path"><summary>{{ file.path }}</summary><pre class="preview-body">{{ file.content }}</pre></details>
    </template>
  </el-dialog>
</template>

<style scoped>
.preview-description { color: var(--drama-text-secondary, #657084); line-height: 1.7; }
.preview-body { padding: 18px; max-height: 55vh; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; border: 1px solid var(--drama-border, #e0e5ed); border-radius: 8px; background: var(--drama-surface-muted, #f7f8fa); font-family: inherit; font-size: 13px; line-height: 1.85; }
details { margin-top: 16px; } summary { cursor: pointer; font-size: 13px; overflow-wrap: anywhere; }
</style>
