<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue';
import { getShortDramaSkill } from '@/api/shortDrama/skills';
import type { ShortDramaSkill, ShortDramaSkillDetail, ShortDramaSkillType } from '@/api/shortDrama/types';
import { validateDramaSkillBindings } from '@/utils/dramaSkillBindings';
import type { DramaSkillBindingState } from '@/utils/dramaSkillBindings';
import { useDramaSkillCatalog } from '@/composables/useDramaSkillCatalog';

const props = defineProps<{ legacyLabel?: string; requireAesthetic?: boolean; disabled?: boolean; directorOnly?: boolean }>();
const aesthetic = defineModel<string>('aesthetic', { default: '' });
const director = defineModel<string>('director', { default: '' });
const emit = defineEmits<{ validity: [state: DramaSkillBindingState]; catalog: [skills: ShortDramaSkill[]] }>();
const { catalog, loaded, loading, error, refresh } = useDramaSkillCatalog({ types: props.directorOnly ? ['director'] : undefined });
const defaultDirector = '__project_default__';
const directorSelection = computed({ get: () => director.value || defaultDirector, set: value => { director.value = value === defaultDirector ? '' : value; } });
const previewOpen = shallowRef(false), previewLoading = shallowRef(false), previewError = shallowRef('');
const preview = ref<ShortDramaSkillDetail>();
let previewEpoch = 0;
const aestheticSkills = computed(() => catalog.value.filter(skill => skill.type === 'aesthetic'));
const directorSkills = computed(() => catalog.value.filter(skill => skill.type === 'director'));
const validity = computed(() => validateDramaSkillBindings({ aestheticSkillName: props.directorOnly ? '' : aesthetic.value, directorSkillName: director.value }, catalog.value, loaded.value, props.requireAesthetic));
const selectedCustomSkill = computed(() => !!director.value || (!props.directorOnly && !!aesthetic.value));
watch(validity, state => emit('validity', state), { immediate: true });
watch(catalog, skills => emit('catalog', skills), { immediate: true });

function missing(name: string, type: ShortDramaSkillType) {
  return loaded.value && !!name && !catalog.value.some(skill => skill.name === name && skill.type === type);
}

async function showSkill(name: string) {
  const epoch = ++previewEpoch;
  preview.value = undefined; previewError.value = ''; previewLoading.value = true; previewOpen.value = true;
  try { const detail = await getShortDramaSkill(name); if (epoch === previewEpoch) preview.value = detail; }
  catch (failure) { if (epoch === previewEpoch) previewError.value = failure instanceof Error ? failure.message : '技能详情加载失败'; }
  finally { if (epoch === previewEpoch) previewLoading.value = false; }
}

</script>

<template>
  <section class="production-skills" :class="{ compact: directorOnly }" :aria-label="directorOnly ? '分镜方式设置' : '制作技能'">
    <div v-if="!directorOnly" class="skills-header"><strong>制作技能</strong></div>
    <div class="skills-grid" :class="{ 'director-only': directorOnly }">
      <div v-if="!directorOnly" class="skill-field">
        <label>视觉风格 · 审美技能</label>
        <div class="skill-select">
          <el-select v-model="aesthetic" filterable :loading="loading" :disabled="disabled" placeholder="选择审美技能" aria-label="审美技能">
            <el-option v-if="legacyLabel && !requireAesthetic" value="" :label="`沿用原风格：${legacyLabel}`" />
            <el-option v-else-if="!requireAesthetic" value="" label="未绑定审美技能" />
            <el-option v-if="missing(aesthetic, 'aesthetic')" :value="aesthetic" :label="`${aesthetic}（缺失，需重选）`" disabled />
            <el-option v-for="skill in aestheticSkills" :key="skill.name" :value="skill.name" :label="`${skill.title}${skill.enabled ? '' : '（已停用）'}`" :disabled="!skill.enabled" />
          </el-select>
          <el-button size="small" :disabled="!aesthetic" @click="showSkill(aesthetic)">查看说明</el-button>
        </div>
      </div>
      <div class="skill-field">
        <label>分镜方式</label>
        <div class="skill-select">
          <el-select v-model="directorSelection" filterable :loading="loading" :disabled="disabled" placeholder="默认分镜方式" aria-label="分镜方式">
            <el-option :value="defaultDirector" label="默认分镜方式" />
            <el-option v-if="missing(director, 'director')" :value="director" :label="`${director}（缺失，需重选）`" disabled />
            <el-option v-for="skill in directorSkills" :key="skill.name" :value="skill.name" :label="`${skill.title}${skill.enabled ? '' : '（已停用）'}`" :disabled="!skill.enabled" />
          </el-select>
          <el-button v-if="director" size="small" @click="showSkill(director)">查看说明</el-button>
        </div>
      </div>
    </div>
    <div v-if="error && selectedCustomSkill" class="skill-error" role="alert">分镜方式列表暂未读取，请重试。<el-button text size="small" :loading="loading" @click="refresh">重新读取</el-button></div>
    <p v-else-if="loaded && !validity.ready" class="skill-error" role="status">{{ validity.reason }}</p>
    <div class="skills-actions"><slot name="actions" /></div>
    <el-dialog v-model="previewOpen" :title="preview?.title || '技能说明'" width="min(900px, 94vw)" append-to-body>
      <p v-if="previewLoading">正在读取技能包…</p>
      <p v-if="previewError" class="skill-error" role="alert">{{ previewError }}</p>
      <template v-if="preview">
        <p class="skill-summary">{{ preview.description }}</p>
        <p class="skill-meta">{{ preview.type === 'aesthetic' ? '审美' : '导演' }} · {{ preview.enabled ? '已启用' : '已停用' }}</p>
        <details open><summary>SKILL.md · Markdown 正文</summary><pre class="skill-body">{{ preview.body }}</pre></details>
        <details v-for="file in preview.files" :key="file.path"><summary>{{ file.path }}</summary><pre class="skill-body">{{ file.content }}</pre></details>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.production-skills { margin: 16px 0; padding: 16px 20px; border: 1px solid #dbe3ef; border-radius: 12px; background: #f8fafc; color: #334155; }
.production-skills.compact { background:var(--drama-surface-strong); border-color:var(--drama-border); padding:14px 16px; }
.skills-header, .skill-select, .skills-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.skills-header { justify-content: space-between; margin-bottom: 12px; }
.skills-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.skills-grid.director-only { grid-template-columns: 1fr; }
.skill-field { min-width: 0; }.skill-field label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; }
.skill-select .el-select { flex: 1; min-width: 180px; }.skill-field p, .skill-summary { margin: 8px 0 0; font-size: 13px; line-height: 1.7; }
.skills-actions:empty { display: none; }.skills-actions { margin-top: 12px; }
.skill-error { margin: 8px 0; color: #b45309; font-size: 13px; line-height: 1.6; }.skill-meta { margin: 12px 0; color: #64748b; font-size: 12px; overflow-wrap: anywhere; }
details { margin-top: 14px; }summary { cursor: pointer; font-weight: 600; font-size: 13px; overflow-wrap: anywhere; }
.skill-body { margin: 10px 0; padding: 16px; max-height: 55vh; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; background: #f1f5f9; border-radius: 8px; line-height: 1.65; font-size: 13px; }
@media (max-width: 760px) { .skills-grid { grid-template-columns: 1fr; }.production-skills { padding: 14px; } }
</style>
