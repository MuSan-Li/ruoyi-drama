<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { Picture, ArrowRight } from '@element-plus/icons-vue';
import type { GetSessionListVO } from '@/api/model/types';
import { useDramaSkillCatalog } from '@/composables/useDramaSkillCatalog';
import DramaSkillPreview from './DramaSkillPreview.vue';

const props = defineProps<{ aesthetic: string; models: GetSessionListVO[]; saving?: boolean; disabled?: boolean }>();
const imageModel = defineModel<string>('imageModel', { default: '' });
const emit = defineEmits<{ select: [name: string] }>();
const { catalog, loaded, loading, error, refresh } = useDramaSkillCatalog({ types: ['aesthetic'] });
const choices = computed(() => catalog.value.filter(skill => skill.type === 'aesthetic'));
const missing = computed(() => loaded.value && !!props.aesthetic && !choices.value.some(skill => skill.name === props.aesthetic));
const previewName = shallowRef('');
</script>

<template>
  <section class="asset-visual-style" aria-label="资产视觉风格">
    <div class="visual-heading"><el-icon><Picture /></el-icon><div><strong>资产视觉风格</strong><p>统一角色、场景与道具的画面风格</p></div></div>
    <div class="visual-fields">
      <div class="visual-field"><div class="field-label"><label>视觉风格</label><el-button v-if="aesthetic" text size="small" @click="previewName = aesthetic">说明<el-icon><ArrowRight /></el-icon></el-button></div>
        <el-select :model-value="aesthetic" filterable :disabled="disabled || saving || !loaded" :loading="loading || saving" aria-label="资产视觉风格" @update:model-value="emit('select', $event)">
          <el-option value="" label="跟随剧本基调" />
          <el-option v-if="missing" :value="aesthetic" :label="`${aesthetic}（需重选）`" disabled />
          <el-option v-for="skill in choices" :key="skill.name" :value="skill.name" :label="`${skill.title}${skill.enabled ? '' : '（已停用）'}`" :disabled="!skill.enabled" />
        </el-select>
      </div>
      <div class="visual-field"><div class="field-label"><label>图片模型</label></div><el-select v-model="imageModel" :disabled="disabled || saving" aria-label="资产图片模型"><el-option v-for="model in models" :key="model.modelName" :label="model.modelName || ''" :value="model.modelName || ''" /></el-select></div>
    </div>
    <p v-if="error" class="visual-note error" role="alert">风格列表读取失败。<el-button text size="small" @click="refresh">重新读取</el-button></p>
    <p v-else class="visual-note" aria-live="polite">{{ saving ? '正在保存视觉风格…' : '选择后自动保存，用于接下来生成的图片。' }}</p>
    <DramaSkillPreview v-model="previewName" />
  </section>
</template>

<style scoped>
.asset-visual-style { container: asset-style / inline-size; margin: 4px 0 22px; padding: 20px 22px 16px; border: 1px solid var(--drama-border, #e0e5ed); border-radius: 12px; background: var(--drama-surface-muted, #f7f8fa); }
.visual-heading { display: flex; align-items: center; gap: 11px; margin-bottom: 17px; }.visual-heading > .el-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; background: var(--drama-surface, white); border: 1px solid var(--drama-border, #e0e5ed); color: var(--drama-accent, #4568db); font-size: 18px; }.visual-heading strong { font-size: 14px; color: var(--drama-text, #253249); }.visual-heading p { margin: 4px 0 0; font-size: 12px; color: var(--drama-text-secondary, #657084); }
.visual-fields { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; }.visual-field { min-width: 0; }.field-label { display: flex; justify-content: space-between; align-items: center; height: 24px; margin-bottom: 6px; }.field-label label { font-size: 12px; font-weight: 600; }.field-label .el-button { height: 24px; padding: 0; color: var(--drama-text-secondary, #657084); }.field-label .el-icon { margin-left: 3px; }.visual-field .el-select { width: 100%; }.visual-field :deep(.el-select__wrapper) { min-height: 38px; font-size: 13px; border-radius: 7px; }
.visual-note { margin: 12px 0 0; font-size: 11px; color: var(--drama-text-tertiary, #8a94a6); line-height: 1.6; }.visual-note.error { color: #a16a26; }
@media(max-width: 700px) { .asset-visual-style { padding: 16px; }.visual-fields { grid-template-columns: 1fr; gap: 14px; } }
@container asset-style (max-width: 600px) { .visual-fields { grid-template-columns: 1fr; gap: 14px; } }
</style>
