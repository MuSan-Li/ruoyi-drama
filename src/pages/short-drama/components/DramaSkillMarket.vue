<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { listDramaSkillMarket } from '@/api/shortDrama/skills';
import type { DramaMarketEntry } from '@/api/shortDrama/skills';
import DramaSkillMarketDetail from './DramaSkillMarketDetail.vue';

const visible = defineModel<boolean>({ default: false });
const { t } = useI18n();
const entries = ref<DramaMarketEntry[]>([]);
const loading = ref(false);
const error = ref('');
const category = ref('system');
const search = ref('');
const selectedKey = ref('');
const categories = ['system', 'production', 'aesthetic', 'director'];
const key = (entry: DramaMarketEntry) => `${entry.type}:${entry.name}`;
const filtered = computed(() => entries.value.filter(entry => entry.type === category.value
  && `${entry.title} ${entry.name} ${entry.description}`.toLowerCase().includes(search.value.trim().toLowerCase())));
const selected = computed(() => filtered.value.find(entry => key(entry) === selectedKey.value) || filtered.value[0]);
async function refresh() {
  if (loading.value) return;
  loading.value = true; error.value = '';
  try { entries.value = await listDramaSkillMarket(); }
  catch (failure) { error.value = failure instanceof Error ? failure.message : t('skillMarket.loadFailed'); }
  finally { loading.value = false; }
}
watch(visible, open => { if (open) void refresh(); });
</script>
<template>
  <el-dialog v-model="visible" :title="t('layout.skillMarket')" width="min(1120px, 96vw)" append-to-body class="drama-market-dialog">
    <div class="market-toolbar"><el-button :loading="loading" @click="refresh">{{ t('skillMarket.refresh') }}</el-button></div>
    <el-tabs v-model="category"><el-tab-pane v-for="type in categories" :key="type" :label="`${t(`skillMarket.categories.${type}`)} (${entries.filter(entry => entry.type === type).length})`" :name="type" /></el-tabs>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <div v-loading="loading" class="market-body">
      <aside>
        <el-input v-model="search" clearable :placeholder="t('skillMarket.search')" :aria-label="t('skillMarket.search')" />
        <div class="market-list">
          <button v-for="entry in filtered" :key="key(entry)" type="button" :class="{ selected: selected && key(entry) === key(selected) }" @click="selectedKey = key(entry)"><strong>{{ entry.title }}</strong><span>{{ entry.description }}</span></button>
          <el-empty v-if="!filtered.length && !loading" :description="t('skillMarket.empty')" :image-size="60" />
        </div>
      </aside>
      <DramaSkillMarketDetail v-if="selected" :entry="selected" />
      <el-empty v-else-if="!loading" :description="t('skillMarket.empty')" />
    </div>
  </el-dialog>
</template>
<style scoped>
.market-toolbar { display: flex; gap: 14px; justify-content: space-between; align-items: center; }.market-toolbar p { color: #64748b; font-size: 13px; line-height: 1.7; }
.market-body { display: grid; grid-template-columns: 270px minmax(0, 1fr); height: min(62vh, 650px); min-height: 280px; }aside { display: flex; flex-direction: column; gap: 12px; padding-right: 16px; border-right: 1px solid #e2e8f0; min-height: 0; }
.market-list { overflow: auto; }.market-list button { display: grid; gap: 7px; width: 100%; text-align: left; padding: 14px; margin-bottom: 9px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; color: #334155; cursor: pointer; }.market-list button.selected { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }.market-list strong { font-size: 13px; }.market-list span { font-size: 12px; line-height: 1.65; }
@media (max-width: 700px) { .market-body { grid-template-columns: 1fr; height: 68vh; overflow: auto; }aside { border-right: 0; padding-right: 0; }.market-list { display: flex; gap: 8px; max-height: 150px; }.market-list button { min-width: 200px; } }
</style>
