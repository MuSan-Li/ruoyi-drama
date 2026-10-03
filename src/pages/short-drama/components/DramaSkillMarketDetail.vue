<script setup lang="ts">
import { ElMessage } from '@/utils/message';
import { useI18n } from 'vue-i18n';
import type { DramaMarketEntry } from '@/api/shortDrama/skills';
const props = defineProps<{ entry: DramaMarketEntry }>();
const { t } = useI18n();
async function copy() {
  try { await navigator.clipboard.writeText(props.entry.body); ElMessage.success(t('skillMarket.copied')); }
  catch { ElMessage.error(t('skillMarket.copyFailed')); }
}
</script>
<template>
  <article class="market-detail">
    <header><h3>{{ entry.title }}</h3><el-button size="small" @click="copy">{{ t('skillMarket.copy') }}</el-button></header>
    <p>{{ entry.description }}</p>
    <small>{{ t('skillMarket.version') }} {{ entry.version }} · {{ entry.enabled ? t('skillMarket.enabled') : t('skillMarket.disabled') }}</small>
    <pre>{{ entry.body }}</pre>
    <details v-for="file in entry.files" :key="file.path"><summary>{{ file.path }}</summary><pre>{{ file.content }}</pre></details>
  </article>
</template>
<style scoped>
.market-detail { min-width: 0; padding: 4px 18px 18px; overflow: auto; color: #334155; }
header { display: flex; gap: 12px; align-items: center; justify-content: space-between; }h3 { font-size: 18px; }
p { margin: 12px 0; font-size: 13px; line-height: 1.7; }small { display: block; overflow-wrap: anywhere; font-size: 11px; color: #64748b; }
pre { padding: 18px; margin-top: 16px; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.75; font-size: 13px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
summary { cursor: pointer; margin-top: 18px; overflow-wrap: anywhere; }
</style>
