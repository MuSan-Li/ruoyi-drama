<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ArrowRight, Search, User } from '@element-plus/icons-vue';
import type { ShortDramaCharacter, ShortDramaCharacterAppearance } from '@/api/shortDrama/types';
import { appearancePreview, characterPreview } from '@/utils/characterPresentation';
import StudioBadge from '@/components/studio/StudioBadge.vue';
import StudioSection from '@/components/studio/StudioSection.vue';
import StudioDisclosure from '@/components/studio/StudioDisclosure.vue';
import CharacterVoice from './CharacterVoice.vue';
import GeneratedAssetImage from './GeneratedAssetImage.vue';

const props = defineProps<{ characters: ShortDramaCharacter[]; projectId: string; saving: boolean }>();
const emit = defineEmits<{ save: [] }>();
defineSlots<{ appearance(props: { appearance: ShortDramaCharacterAppearance }): unknown }>();
const query = ref('');
const level = ref('');
const activeId = ref<string>();
const appearanceId = ref('');
const drawerOpen = ref(false);
const inspectorContent = ref<HTMLElement>();
const roleLabels: Record<string, string> = { S: '主角', A: '核心配角', B: '重要配角', C: '次要角色', D: '群众' };
const levels = computed(() => [...new Set(props.characters.map(item => item.roleLevel).filter((item): item is string => !!item))]);
const filtered = computed(() => props.characters.filter(item => (!level.value || item.roleLevel === level.value) && (!query.value.trim() || [item.name, item.aliases, item.introduction, item.personalityTags].join(' ').toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase()))));
const cards = computed(() => filtered.value.map(character => ({ character, cover: characterPreview(character), traits: tags(character) })));
const active = computed(() => props.characters.find(item => item.id === activeId.value));
const ready = computed(() => props.characters.filter(item => characterPreview(item).selected).length);
const appearanceCount = computed(() => props.characters.reduce((sum, item) => sum + (item.appearances?.length || 0), 0));
const preview = computed(() => appearancePreview(active.value?.appearances?.find((item, index) => String(item.id || index) === appearanceId.value)));
function openCharacter(character: ShortDramaCharacter) { activeId.value = character.id; drawerOpen.value = true; }
function resetInspectorScroll() {
  const body = inspectorContent.value?.parentElement;
  if (body) { body.scrollTop = 0; body.scrollLeft = 0; }
}
function tags(character: ShortDramaCharacter) { return (character.personalityTags || '').split(/[,，、]/).map(item => item.trim()).filter(Boolean); }
watch(() => active.value?.id, () => { appearanceId.value = String(active.value?.appearances?.[0]?.id || 0); });
watch(() => props.projectId, () => { drawerOpen.value = false; activeId.value = undefined; query.value = ''; level.value = ''; });
</script>

<template>
  <section class="character-library" aria-label="角色档案库">
    <StudioSection title="角色档案" compact>
      <template #actions><StudioBadge tone="accent">{{ characters.length }} 位角色</StudioBadge><StudioBadge>{{ appearanceCount }} 个形象</StudioBadge><StudioBadge tone="success" dot>{{ ready }} 位已有选用图片</StudioBadge></template>
    </StudioSection>
    <div class="library-toolbar">
      <el-input v-model="query" clearable :prefix-icon="Search" placeholder="搜索角色、身份或性格" aria-label="搜索角色" />
      <el-select v-model="level" clearable placeholder="全部角色层级" aria-label="筛选角色层级"><el-option label="全部角色" value="" /><el-option v-for="item in levels" :key="item" :label="roleLabels[item] || item" :value="item" /></el-select>
      <span class="result-count">显示 {{ filtered.length }} / {{ characters.length }}</span>
    </div>
    <div v-if="filtered.length" class="character-grid">
      <button v-for="{ character, cover, traits } in cards" :key="character.id" type="button" class="character-card" :aria-label="`查看${character.name}角色档案`" @click="openCharacter(character)">
        <div class="portrait">
          <GeneratedAssetImage v-if="cover.url" :src="cover.url" :title="`${character.name}形象`" :interactive="false" />
          <div v-else class="portrait-empty"><el-icon><User /></el-icon><span>等待人物形象</span></div>
          <StudioBadge class="portrait-level" :tone="character.roleLevel === 'S' ? 'accent' : 'neutral'">{{ roleLabels[character.roleLevel || ''] || character.roleLevel || '角色' }}</StudioBadge>
          <span class="portrait-status"><i :class="{ ready: cover.selected }" />{{ cover.selected ? '已选用形象' : cover.source === 'reference' ? '原始参考图' : cover.url ? '候选待选用' : '尚未生成' }}</span>
        </div>
        <div class="character-copy">
          <div class="character-heading"><h3>{{ character.name }}</h3><span>{{ character.appearances?.length || 0 }} 个形象</span></div>
          <div class="identity"><span>{{ character.gender || '性别未设定' }}</span><i /><span>{{ character.ageRange || '年龄未设定' }}</span><template v-if="character.costumeTier"><i /><span>服饰 Lv{{ character.costumeTier }}</span></template></div>
          <p v-if="character.introduction" class="introduction">{{ character.introduction }}</p>
          <div class="traits"><StudioBadge v-for="tag in traits.slice(0, 3)" :key="tag">{{ tag }}</StudioBadge><span v-if="traits.length > 3" class="more-traits">+{{ traits.length - 3 }}</span></div>
          <div class="card-footer"><span>人物 · 形象 · 声音</span><span class="card-link">查看档案 <el-icon><ArrowRight /></el-icon></span></div>
        </div>
      </button>
    </div>
    <el-empty v-else description="没有匹配的角色，试试其他关键词或层级" />
  </section>

  <el-drawer v-model="drawerOpen" size="min(760px, 100vw)" append-to-body class="character-inspector" :title="`${active?.name || ''} · 角色档案`" @opened="resetInspectorScroll">
    <div v-if="active" ref="inspectorContent" class="inspector-content">
      <div class="profile-overview">
        <div class="profile-image"><GeneratedAssetImage v-if="preview.url" :src="preview.url" :title="`${active.name}形象预览`" /><el-icon v-else><User /></el-icon></div>
        <div class="profile-copy"><span class="profile-kicker">CHARACTER PROFILE</span><h2>{{ active.name }}</h2><StudioBadge tone="accent">{{ roleLabels[active.roleLevel || ''] || active.roleLevel || '角色' }}</StudioBadge><dl><div><dt>性别</dt><dd>{{ active.gender || '未设定' }}</dd></div><div><dt>年龄</dt><dd>{{ active.ageRange || '未设定' }}</dd></div><div v-if="active.costumeTier"><dt>服饰等级</dt><dd>Lv{{ active.costumeTier }}</dd></div><div v-if="active.aliases"><dt>别名</dt><dd>{{ active.aliases }}</dd></div></dl><div v-if="tags(active).length" class="traits"><StudioBadge v-for="tag in tags(active)" :key="tag">{{ tag }}</StudioBadge></div></div>
      </div>
      <StudioDisclosure v-if="active.introduction || active.visualDescription" title="人物设定" default-open><p v-if="active.introduction" class="profile-description">{{ active.introduction }}</p><p v-if="active.visualDescription && active.visualDescription.trim() !== active.introduction?.trim()" class="profile-description">{{ active.visualDescription }}</p></StudioDisclosure>
      <div class="appearance-workbench">
        <StudioSection title="形象版本" compact><template #actions><el-button size="small" type="primary" :loading="saving" @click="emit('save')">保存提示词</el-button></template></StudioSection>
        <el-tabs v-if="active.appearances?.length" v-model="appearanceId" class="appearance-tabs"><el-tab-pane v-for="(appearance, index) in active.appearances" :key="appearance.id || index" :name="String(appearance.id || index)" :label="appearance.changeReason || `形象 ${appearance.appearanceIndex || index + 1}`"><slot name="appearance" :appearance="appearance" /></el-tab-pane></el-tabs>
        <el-empty v-else description="暂无形象版本" />
      </div>
      <KeepAlive :key="projectId"><CharacterVoice v-if="active.id" :key="active.id" :project-id="projectId" :character="active" /></KeepAlive>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.character-library { display:grid; gap:20px; min-width:0; }.library-toolbar { display:flex; align-items:center; flex-wrap:wrap; gap:10px; padding:12px; border:1px solid var(--drama-border); border-radius:var(--drama-radius-md); background:var(--drama-surface-muted); }.library-toolbar :deep(.el-input) { flex:1 1 220px; }.library-toolbar :deep(.el-select) { width:160px; }.result-count { margin-left:auto; font-size:11px; color:var(--drama-text-tertiary); white-space:nowrap; }
.character-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr)); gap:20px; align-items:start; }
.character-card { min-width:0; padding:0; overflow:hidden; border:1px solid var(--drama-border); border-radius:var(--drama-radius-lg); background:var(--drama-surface-strong); cursor:pointer; text-align:left; color:var(--drama-text); box-shadow:var(--drama-shadow-sm); transition:border-color .18s,box-shadow .18s,transform .18s; &:hover { border-color:var(--drama-primary); box-shadow:var(--drama-shadow-md); transform:translateY(-2px); } &:focus-visible { outline:3px solid var(--drama-focus); outline-offset:3px; } }
.portrait { --asset-image-height:252px; --asset-image-radius:0; position:relative; height:252px; overflow:hidden; background:var(--drama-image-surface); border-bottom:1px solid var(--drama-border-subtle); img { display:block; width:100%; height:100%; object-fit:contain; } }.portrait-empty { display:grid; place-content:center; justify-items:center; gap:14px; height:100%; color:var(--drama-text-tertiary); font-size:12px; .el-icon { font-size:40px; opacity:.5; } }.portrait-level { position:absolute; left:14px; top:14px; box-shadow:0 2px 8px rgb(0 0 0 / 4%); }.portrait-status { position:absolute; right:12px; bottom:12px; display:flex; align-items:center; gap:5px; padding:5px 8px; color:var(--drama-text-secondary); background:rgb(255 255 255 / 94%); border:1px solid var(--drama-border-subtle); border-radius:6px; font-size:10px; i { width:5px; height:5px; border-radius:50%; background:var(--drama-warning); &.ready { background:var(--drama-success); } } }
.character-copy { display:grid; gap:12px; padding:18px; }.character-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; h3 { margin:0; font-size:20px; font-weight:700; line-height:1.3; overflow-wrap:anywhere; } > span { flex-shrink:0; font-size:11px; color:var(--drama-text-tertiary); } }.identity { display:flex; flex-wrap:wrap; align-items:center; gap:7px; font-size:11px; color:var(--drama-text-secondary); i { width:2px; height:2px; border-radius:50%; background:var(--drama-text-tertiary); } }.introduction { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; margin:0; height:44px; font-size:12px; line-height:22px; color:var(--drama-text-secondary); }.traits { display:flex; align-items:center; flex-wrap:wrap; gap:5px; min-height:24px; }.more-traits { font-size:11px; color:var(--drama-text-tertiary); }.card-footer { display:flex; justify-content:space-between; align-items:center; gap:6px; padding-top:14px; border-top:1px solid var(--drama-border-subtle); font-size:10px; color:var(--drama-text-tertiary); }.card-link { display:flex; align-items:center; gap:4px; color:var(--drama-primary); font-weight:600; }
.inspector-content { display:grid; grid-template-columns:minmax(0,1fr); gap:24px; min-width:0; }.profile-overview { display:grid; min-width:0; grid-template-columns:180px minmax(0,1fr); gap:24px; align-items:start; }.profile-image { --asset-image-height:240px; --asset-image-radius:0; display:grid; place-items:center; height:240px; border:1px solid var(--drama-border); border-radius:var(--drama-radius-md); background:var(--drama-image-surface); overflow:hidden; img { width:100%; height:100%; object-fit:contain; } > .el-icon { font-size:40px; color:var(--drama-text-tertiary); } }.profile-kicker { font-size:9px; letter-spacing:.14em; color:var(--drama-text-tertiary); }.profile-copy { min-width:0; h2 { margin:8px 0 12px; font-size:28px; line-height:1.3; color:var(--drama-text); } dl { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin:20px 0; font-size:12px; div { display:grid; gap:4px; } dt { color:var(--drama-text-tertiary); } dd { margin:0; color:var(--drama-text); overflow-wrap:anywhere; } } }.profile-description { font-size:13px; line-height:1.9; color:var(--drama-text-secondary); margin:0; overflow-wrap:anywhere; & + & { margin-top:12px; } }.appearance-workbench { display:grid; min-width:0; grid-template-columns:minmax(0,1fr); gap:12px; }.appearance-tabs { min-width:0; max-width:100%; }
.appearance-tabs :deep(.el-tabs__item) { max-width:260px; overflow:hidden; text-overflow:ellipsis; }.appearance-tabs :deep(.el-tabs__header) { margin-bottom:16px; }
@media(max-width:640px) { .character-library :deep(.studio-section.compact p), .character-library :deep(.studio-section.compact .eyebrow) { display:none; } .character-grid { gap:14px; }.library-toolbar :deep(.el-select) { flex:1; min-width:150px; }.profile-overview { grid-template-columns:110px minmax(0,1fr); gap:16px; }.profile-image { --asset-image-height:170px; height:170px; }.profile-copy h2 { font-size:24px; }.profile-copy dl { margin:12px 0; }.inspector-content { gap:20px; }.portrait { --asset-image-height:260px; height:260px; } }
</style>
