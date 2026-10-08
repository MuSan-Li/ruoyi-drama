<script setup lang="ts">
import { ArrowLeft, ArrowRight, Plus, Delete } from '@element-plus/icons-vue';
defineProps<{ sceneNo?: number; index: number; total: number; hasPrevious: boolean; hasNext: boolean; disabled?: boolean; deleteDisabled?: boolean }>();
const title = defineModel<string>('title', { default: '' });
const emit = defineEmits<{ previous: []; next: []; add: []; delete: [] }>();
</script>

<template>
  <header class="shot-editor-header">
    <div class="shot-header-row">
      <div class="shot-heading"><span class="shot-number">{{ String(sceneNo || index + 1).padStart(2, '0') }}</span><span>镜头编辑</span></div>
      <nav class="shot-navigation" aria-label="镜头导航"><el-button text :icon="ArrowLeft" :disabled="!hasPrevious || disabled" aria-label="上一镜" @click="emit('previous')" /><span>{{ index + 1 }} <i>/ {{ total }}</i></span><el-button text :icon="ArrowRight" :disabled="!hasNext || disabled" aria-label="下一镜" @click="emit('next')" /></nav>
      <div class="shot-header-actions"><el-button text :icon="Plus" :disabled="disabled" @click="emit('add')">新增镜头</el-button><el-button text class="delete-shot" :icon="Delete" :disabled="disabled || deleteDisabled" aria-label="删除镜头" @click="emit('delete')" /></div>
    </div>
    <el-input v-model="title" class="shot-title" placeholder="为这个镜头命名" aria-label="镜头标题" :disabled="disabled" />
  </header>
</template>

<style scoped>
.shot-editor-header { min-width: 0; padding-bottom: 17px; border-bottom: 1px solid var(--drama-border-subtle, #edf0f4); }.shot-header-row { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; margin-bottom: 13px; }.shot-heading { display: flex; align-items: center; gap: 9px; font-size: 12px; font-weight: 600; color: var(--drama-text-secondary, #657084); }.shot-number { display: grid; place-items: center; min-width: 30px; height: 28px; padding: 0 5px; border-radius: 6px; background: var(--drama-accent-soft, #edf2ff); color: var(--drama-accent, #4568db); font-size: 12px; font-weight: 750; font-variant-numeric: tabular-nums; }.shot-navigation { display: flex; align-items: center; gap: 8px; }.shot-navigation span { min-width: 48px; text-align: center; font-size: 12px; font-variant-numeric: tabular-nums; color: var(--drama-text, #253249); }.shot-navigation i { font-style: normal; color: var(--drama-text-tertiary, #8a94a6); }.shot-navigation .el-button { width: 26px; height: 28px; padding: 0; }.shot-header-actions { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }.shot-header-actions .el-button { height: 28px; padding: 0 8px; margin: 0; font-size: 12px; color: var(--drama-text-secondary, #657084); }.shot-header-actions .delete-shot { color: #aa6868; padding: 0 6px; }.shot-title :deep(.el-input__wrapper) { box-shadow: none; padding: 2px 0; background: transparent; border-radius: 0; border-bottom: 1px solid transparent; transition: border-color .15s; }.shot-title :deep(.el-input__wrapper:hover), .shot-title :deep(.el-input__wrapper.is-focus) { border-bottom-color: var(--drama-accent, #4568db); }.shot-title :deep(.el-input__inner) { height: 32px; color: var(--drama-text, #253249); font-size: 18px; font-weight: 650; }
@media (max-width: 580px) { .shot-header-row { grid-template-columns: 1fr auto; gap: 8px; }.shot-heading { grid-row: 1; }.shot-header-actions { grid-row: 2; grid-column: 1 / -1; justify-content: flex-end; }.shot-navigation { grid-column: 2; grid-row: 1; }.shot-title :deep(.el-input__inner) { font-size: 16px; } }
</style>
