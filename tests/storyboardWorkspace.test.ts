import assert from 'node:assert/strict';
import { test } from 'node:test';
import { effectScope, ref } from 'vue';
import { storyboardKey, useStoryboardWorkspace } from '../src/composables/useStoryboardWorkspace.ts';
import type { ShortDramaStoryboard } from '../src/api/shortDrama/types.ts';

function shot(id: string, scriptId: string, sceneNo: number): ShortDramaStoryboard {
  return { id, scriptId, projectId: 'project', sceneNo, videoStatus: 'done', videoUrl: `approved/${id}`, durationSeconds: 15 };
}

test('the current script opens four shots while preserving the original 15-second version', () => {
  const scope = effectScope();
  try {
    scope.run(() => {
      const original = [shot('old-1', 'old', 1), ...[1, 2, 3, 4].map(n => shot(`new-${n}`, 'new', n))];
      const before = structuredClone(original);
      const shots = ref(original);
      const workspace = useStoryboardWorkspace(shots, () => 'new');
      assert.equal(workspace.versions.value.length, 2);
      assert.deepEqual(workspace.workspaceStoryboards.value.map(row => row.id), ['new-1', 'new-2', 'new-3', 'new-4']);
      assert.equal(workspace.visibleStoryboards.value[0].id, 'new-1');
      assert.equal(workspace.adjacentShots.value.after?.id, 'new-2');
      assert.deepEqual(original, before);

      workspace.selectedVersionId.value = 'old';
      assert.equal(workspace.visibleStoryboards.value[0].id, 'old-1');
      assert.equal(workspace.adjacentShots.value.after, undefined);
      workspace.selectedVersionId.value = 'new';
      assert.equal(workspace.workspaceStoryboards.value.reduce((sum, row) => sum + (row.durationSeconds || 0), 0), 60);
      assert.equal(shots.value.length, 5);
    });
  } finally { scope.stop(); }
});

test('duplicate scene numbers select and highlight the exact row ID across versions', () => {
  const scope = effectScope();
  try {
    scope.run(() => {
      const shots = ref([shot('old-1', 'old', 1), shot('new-1', 'new', 1), shot('new-2', 'new', 2)]);
      const workspace = useStoryboardWorkspace(shots, () => 'new');
      workspace.selectShot('old-1');
      assert.equal(workspace.selectedVersionId.value, 'old');
      assert.deepEqual(workspace.visibleStoryboards.value.map(row => row.id), ['old-1']);
      workspace.selectShot('new-1');
      assert.equal(workspace.selectedVersionId.value, 'new');
      assert.deepEqual(workspace.visibleStoryboards.value.map(row => row.id), ['new-1']);
      assert.equal(shots.value.filter(row => storyboardKey(row) === workspace.selectedShotId.value).length, 1);
      workspace.selectShot('new-2');
      shots.value[2].sceneNo = 1;
      shots.value = shots.value.filter(row => row.id !== 'new-1');
      assert.equal(workspace.visibleStoryboards.value[0].id, 'new-2');
      assert.equal(workspace.selectedShotIndex.value, 0);
    });
  } finally { scope.stop(); }
});

test('a newly loaded script defaults to its own version and leaves old media untouched', () => {
  const scope = effectScope();
  try {
    scope.run(() => {
      const current = ref('new');
      const shots = ref([shot('old-1', 'old', 1), shot('new-1', 'new', 1)]);
      const workspace = useStoryboardWorkspace(shots, () => current.value);
      workspace.selectedVersionId.value = 'old';
      shots.value.push(shot('latest-1', 'latest', 1));
      current.value = 'latest';
      assert.equal(workspace.visibleStoryboards.value[0].id, 'latest-1');
      assert.equal(shots.value[0].videoUrl, 'approved/old-1');
      shots.value = [];
      assert.deepEqual(workspace.visibleStoryboards.value, []);
      assert.equal(workspace.selectedShotId.value, '');
    });
  } finally { scope.stop(); }
});
