import { onMounted, ref, shallowRef } from 'vue';
import { listShortDramaSkills, listDramaSkillCategories } from '@/api/shortDrama/skills';
import type { DramaSkillCategory } from '@/api/shortDrama/skills';
import type { ShortDramaSkill, ShortDramaSkillType } from '@/api/shortDrama/types';

/** Loads the real skill catalog for validation without coupling it to a visible picker. */
export function useDramaSkillCatalog(options: { types?: ShortDramaSkillType[]; autoLoad?: boolean } = {}) {
  const catalog = ref<ShortDramaSkill[]>([]);
  const categories = ref<DramaSkillCategory[]>([]);
  const loaded = shallowRef(false);
  const loading = shallowRef(false);
  const error = shallowRef('');

  async function refresh() {
    loading.value = true;
    error.value = '';
    loaded.value = false;
    try {
      const [lists, categoryList] = await Promise.all([
        options.types ? Promise.all(options.types.map(type => listShortDramaSkills(type))) : Promise.all([listShortDramaSkills()]),
        listDramaSkillCategories(),
      ]);
      catalog.value = lists.flat();
      categories.value = categoryList;
      loaded.value = true;
    } catch (failure) {
      error.value = failure instanceof Error ? failure.message : '技能列表加载失败';
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => { if (options.autoLoad !== false) void refresh(); });

  return { catalog, categories, loaded, loading, error, refresh };
}
