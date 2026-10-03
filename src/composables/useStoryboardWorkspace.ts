import { computed, shallowRef, watch, type Ref } from 'vue';
import type { ShortDramaStoryboard } from '../api/shortDrama/types';

export interface StoryboardVersionOption {
  scriptId: string;
  label: string;
  count: number;
}

export function storyboardKey(shot: ShortDramaStoryboard): string {
  return shot.id || `${shot.scriptId || 'unassigned'}:${shot.sceneNo}`;
}

/** Keep numbered shots within their script version; identity always uses the row ID. */
export function useStoryboardWorkspace(shots: Ref<ShortDramaStoryboard[]>, currentScriptId: () => string | undefined) {
  const selectedVersionId = shallowRef('');
  const selectedShotId = shallowRef('');
  const versions = computed<StoryboardVersionOption[]>(() => {
    const counts = new Map<string, number>();
    for (const shot of shots.value) {
      const scriptId = shot.scriptId || 'unassigned';
      counts.set(scriptId, (counts.get(scriptId) || 0) + 1);
    }
    let historicalIndex = 0;
    return [...counts].sort(([a], [b]) => {
      if (a === currentScriptId()) return -1;
      if (b === currentScriptId()) return 1;
      return b.localeCompare(a);
    }).map(([scriptId, count]) => ({
      scriptId, count,
      label: scriptId === currentScriptId() ? `当前剧本 · ${count} 镜`
        : scriptId === 'unassigned' ? `未标注版本 · ${count} 镜`
          : `历史版本 ${++historicalIndex} · ${count} 镜`,
    }));
  });

  watch([versions, currentScriptId], ([options, current], [, previousCurrent]) => {
    if (current !== previousCurrent || !options.some(option => option.scriptId === selectedVersionId.value)) {
      selectedVersionId.value = options.find(option => option.scriptId === current)?.scriptId || options[0]?.scriptId || '';
    }
  }, { immediate: true, flush: 'sync' });

  const workspaceStoryboards = computed(() => shots.value
    .filter(shot => (shot.scriptId || 'unassigned') === selectedVersionId.value)
    .slice().sort((a, b) => a.sceneNo - b.sceneNo));

  watch(workspaceStoryboards, rows => {
    if (!rows.some(shot => storyboardKey(shot) === selectedShotId.value)) {
      selectedShotId.value = rows[0] ? storyboardKey(rows[0]) : '';
    }
  }, { immediate: true, flush: 'sync' });

  const visibleStoryboards = computed(() => {
    const shot = workspaceStoryboards.value.find(row => storyboardKey(row) === selectedShotId.value);
    return shot ? [shot] : [];
  });
  const selectedShotIndex = computed(() => workspaceStoryboards.value.findIndex(row => storyboardKey(row) === selectedShotId.value));
  const adjacentShots = computed(() => ({
    before: workspaceStoryboards.value[selectedShotIndex.value - 1],
    after: workspaceStoryboards.value[selectedShotIndex.value + 1],
  }));

  function selectShot(id: string) {
    const shot = shots.value.find(row => storyboardKey(row) === id);
    if (!shot) return;
    selectedVersionId.value = shot.scriptId || 'unassigned';
    selectedShotId.value = storyboardKey(shot);
  }

  return { versions, selectedVersionId, selectedShotId, workspaceStoryboards, visibleStoryboards, adjacentShots, selectedShotIndex, selectShot };
}
