import { onMounted, ref, shallowRef } from 'vue';
import { listShortDramaSkills } from '@/api/shortDrama/skills';
import type { ShortDramaSkill, ShortDramaSkillType } from '@/api/shortDrama/types';

/** Loads the real skill catalog for validation without coupling it to a visible picker. */
export function useDramaSkillCatalog(options: { types?: ShortDramaSkillType[]; autoLoad?: boolean } = {}) {
  const catalog = ref<ShortDramaSkill[]>([]);
  const loaded = shallowRef(false);
  const loading = shallowRef(false);
  const error = shallowRef('');

  async function refresh() {
    loading.value = true;
    error.value = '';
    loaded.value = false;
    try {
      const lists = await Promise.all((options.types || ['aesthetic', 'director']).map(type => listShortDramaSkills(type)));
      catalog.value = lists.flat();
      loaded.value = true;
    } catch (failure) {
      error.value = failure instanceof Error ? failure.message : '技能列表加载失败';
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => { if (options.autoLoad !== false) void refresh(); });

  return { catalog, loaded, loading, error, refresh };
}
