<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import { EditPen, VideoCamera, ArrowRight } from '@element-plus/icons-vue';
import type { ShortDramaSkill, ShortDramaSkillType } from '@/api/shortDrama/types';
import { dramaSkillRoleNames, selectDramaSkillCategory, validateDramaSkillBindings } from '@/utils/dramaSkillBindings';
import type { DramaSkillBindingState } from '@/utils/dramaSkillBindings';
import { useDramaSkillCatalog } from '@/composables/useDramaSkillCatalog';
import DramaSkillPreview from './DramaSkillPreview.vue';

const props = defineProps<{ disabled?: boolean; stage?: 'script' | 'storyboard' }>();
const aesthetic = defineModel<string>('aesthetic', { default: '' });
const director = defineModel<string>('director', { default: '' });
const storyboardSkills = defineModel<string[]>('storyboardSkills', { default: () => [] });
const emit = defineEmits<{ validity: [state: DramaSkillBindingState]; catalog: [skills: ShortDramaSkill[]] }>();
const { catalog, loaded, loading, error, refresh } = useDramaSkillCatalog();
const previewName = shallowRef('');
const bindings = computed(() => ({ aestheticSkillName: aesthetic.value, directorSkillName: director.value, storyboardSkillNames: storyboardSkills.value }));
const roles = computed(() => [
  { type: 'screenwriting' as const, title: '编剧风格', hint: '剧情结构、人物塑造与对白', icon: EditPen, defaultLabel: '默认编剧风格' },
  { type: 'director' as const, title: '导演风格', hint: '景别、运镜、表演与接镜', icon: VideoCamera, defaultLabel: '默认导演风格' },
].map(role => ({ ...role,
  choices: catalog.value.filter(skill => skill.type === role.type),
  selected: dramaSkillRoleNames(bindings.value, role.type, catalog.value),
})));
const unknown = computed(() => loaded.value ? storyboardSkills.value.filter(name => !catalog.value.some(skill => skill.name === name)) : []);
const validity = computed(() => validateDramaSkillBindings({ ...bindings.value, aestheticSkillName: '' }, catalog.value, loaded.value));
watch(validity, state => emit('validity', state), { immediate: true });
watch(catalog, skills => emit('catalog', skills), { immediate: true });

function select(type: ShortDramaSkillType, name: string) {
  const next = selectDramaSkillCategory(bindings.value, type, name, catalog.value);
  director.value = next.directorSkillName;
  storyboardSkills.value = next.storyboardSkillNames || [];
}
</script>

<template>
  <section class="creative-styles" aria-label="创作风格">
    <div class="style-choices">
      <div v-for="role in roles" :key="role.type" class="style-choice">
        <div class="choice-heading"><el-icon><component :is="role.icon" /></el-icon><label>{{ role.title }}</label><span>单选</span></div>
        <p>{{ role.hint }}</p>
        <div class="choice-control">
          <el-select :model-value="role.selected.length > 1 ? '__conflict__' : (role.selected[0] || '')" filterable :loading="loading" :disabled="disabled || !loaded" :aria-label="role.title" :placeholder="role.defaultLabel" @update:model-value="select(role.type, $event)">
            <el-option value="" :label="role.defaultLabel" />
            <el-option v-if="role.selected.length > 1" value="__conflict__" :label="`原有 ${role.selected.length} 项，请选定一个`" disabled />
            <el-option v-if="role.selected.length === 1 && !role.choices.some(skill => skill.name === role.selected[0])" :value="role.selected[0]!" :label="`${role.selected[0]}（需重选）`" disabled />
            <el-option v-for="skill in role.choices" :key="skill.name" :value="skill.name" :label="`${skill.title}${skill.enabled ? '' : '（已停用）'}`" :disabled="!skill.enabled" />
          </el-select>
          <el-button v-if="role.selected.length === 1" text :disabled="!loaded" :aria-label="`查看${role.title}说明`" @click="previewName = role.selected[0]!">说明<el-icon><ArrowRight /></el-icon></el-button>
        </div>
        <p v-if="role.selected.length > 1" class="style-conflict">原选择：{{ role.selected.map(name => catalog.find(skill => skill.name === name)?.title || name).join('、') }}</p>
      </div>
    </div>
    <div v-if="unknown.length" class="unavailable-styles"><span>以下风格已缺失：</span><el-tag v-for="name in unknown" :key="name" :closable="!disabled" @close="storyboardSkills = storyboardSkills.filter(item => item !== name)">{{ name }}</el-tag></div>
    <div v-if="error" class="style-error" role="alert">风格列表读取失败。<el-button text size="small" :loading="loading" @click="refresh">重新读取</el-button></div>
    <div v-if="$slots.actions" class="style-actions"><slot name="actions" /></div>
    <DramaSkillPreview v-model="previewName" />
  </section>
</template>

<style scoped>
.creative-styles { container: creative-styles / inline-size; margin: 0 0 22px; padding: 20px 22px; border: 1px solid var(--drama-border, #e0e5ed); border-radius: 12px; background: var(--drama-surface, #fff); }
.style-choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; }
.style-choice { min-width: 0; }.style-choice + .style-choice { border-left: 1px solid var(--drama-border-subtle, #edf0f4); padding-left: 32px; }
.choice-heading { display: flex; align-items: center; gap: 8px; color: var(--drama-text, #253249); }.choice-heading .el-icon { color: var(--drama-accent, #4568db); font-size: 17px; }.choice-heading label { font-size: 14px; font-weight: 650; }.choice-heading span { margin-left: auto; font-size: 11px; color: var(--drama-text-tertiary, #8a94a6); }
.style-choice p { margin: 7px 0 12px; color: var(--drama-text-secondary, #657084); font-size: 12px; line-height: 1.65; }
.choice-control { display: flex; align-items: center; gap: 8px; }.choice-control .el-select { flex: 1; min-width: 0; }.choice-control .el-button { flex: none; padding: 8px 0 8px 5px; color: var(--drama-text-secondary, #657084); }.choice-control .el-button .el-icon { margin-left: 3px; }
.creative-styles :deep(.el-select__wrapper) { min-height: 38px; border-radius: 7px; font-size: 13px; }
.style-choice .style-conflict, .style-error { color: #a16a26; font-size: 12px; }.style-conflict { overflow-wrap: anywhere; }.unavailable-styles { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 14px; font-size: 12px; }.style-actions { display: flex; justify-content: flex-end; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--drama-border-subtle, #edf0f4); }.style-actions :deep(.el-button) { height: 32px; margin: 0; font-size: 12px; }
@media (max-width: 700px) { .creative-styles { padding: 16px; }.style-choices { grid-template-columns: 1fr; gap: 18px; }.style-choice + .style-choice { border-left: 0; border-top: 1px solid var(--drama-border-subtle, #edf0f4); padding: 18px 0 0; } }
@container creative-styles (max-width: 600px) { .style-choices { grid-template-columns: 1fr; gap: 18px; }.style-choice + .style-choice { border-left: 0; border-top: 1px solid var(--drama-border-subtle, #edf0f4); padding: 18px 0 0; } }
</style>
