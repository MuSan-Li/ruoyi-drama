<script setup lang="ts">
import type { GetSessionListVO } from '@/api/model/types';
import ShotVideoModel from './ShotVideoModel.vue';
import ShotVideoResolution from './ShotVideoResolution.vue';
import ShotVideoDuration from './ShotVideoDuration.vue';
import ShotVideoStartFrame from './ShotVideoStartFrame.vue';

defineProps<{ continuityJson?: string; models: GetSessionListVO[]; model?: string; fallback?: string; supportsResolution?: boolean; disabled?: boolean }>();
const emit = defineEmits<{ update: [value: string] }>();
</script>

<template>
  <section class="shot-generation-settings" aria-label="镜头生成设置">
    <div class="settings-heading"><strong>生成设置</strong><span>参数仅用于当前镜头</span></div>
    <el-form label-position="top" class="settings-grid" :class="{ 'without-resolution': !supportsResolution }" :disabled="disabled" @submit.prevent>
      <ShotVideoModel class="model-field" :continuity-json="continuityJson" :models="models" :fallback="fallback" :disabled="disabled" @update="emit('update', $event)" />
      <ShotVideoResolution v-if="supportsResolution" :model="model" :continuity-json="continuityJson" :disabled="disabled" @update="emit('update', $event)" />
      <ShotVideoDuration :continuity-json="continuityJson" :disabled="disabled" @update="emit('update', $event)" />
    </el-form>
    <ShotVideoStartFrame :continuity-json="continuityJson" :disabled="disabled" @update="emit('update', $event)" />
    <div class="reference-settings"><slot /></div>
  </section>
</template>

<style scoped>
.shot-generation-settings { min-width: 0; padding: 0 0 18px; border-bottom: 1px solid var(--drama-border-subtle, #edf0f4); }.settings-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 14px; }.settings-heading strong { font-size: 13px; font-weight: 650; color: var(--drama-text, #253249); }.settings-heading span { font-size: 11px; color: var(--drama-text-tertiary, #8a94a6); }.settings-grid { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(120px, .8fr) minmax(120px, .75fr); align-items: start; gap: 16px; }.settings-grid.without-resolution { grid-template-columns: minmax(0, 2fr) minmax(140px, 1fr); }
.settings-grid :deep(.el-form-item) { min-width: 0; margin-bottom: 0; }.settings-grid :deep(.el-form-item__label) { font-size: 12px; line-height: 18px; padding: 0; margin-bottom: 7px; height: auto; color: var(--drama-text-secondary, #657084); font-weight: 500; }.settings-grid :deep(.el-form-item__content) { min-width: 0; display: block; line-height: normal; }.settings-grid :deep(.el-select) { width: 100%; }.settings-grid :deep(.el-select__wrapper), .settings-grid :deep(.el-input__wrapper) { min-height: 38px; border-radius: 7px; background: var(--drama-surface, white); font-size: 12px; }.settings-grid :deep(.el-input__inner) { height: 36px; font-size: 13px; }.settings-grid :deep(.el-form-item__error) { position: static; line-height: 1.5; padding-top: 6px; }.reference-settings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; align-items: start; margin-top: 12px; }.reference-settings:empty { display: none; }.reference-settings :deep(details[open]) { grid-column: 1 / -1; }
@container shot-editor (max-width: 650px) { .settings-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }.settings-grid .model-field { grid-column: 1 / -1; }.reference-settings { grid-template-columns: 1fr; } }
@media (max-width: 700px) { .settings-grid, .settings-grid.without-resolution { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }.settings-grid .model-field { grid-column: 1 / -1; }.reference-settings { grid-template-columns: 1fr; }.settings-heading span { display: none; } }
</style>
