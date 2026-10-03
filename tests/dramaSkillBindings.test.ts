import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dramaSkillBindingsChanged, projectAestheticLabel, projectSkillBindings, validateDramaSkillBindings, validateDramaSkillChanges } from '../src/utils/dramaSkillBindings.ts';
import type { ShortDramaSkill } from '../src/api/shortDrama/types.ts';

const catalog: ShortDramaSkill[] = [
  { name: 'aesthetic-a', title: '明代县城审美', type: 'aesthetic', description: '服饰与器物', enabled: true, artStyle: 'chinese-3d', version: 'a1' },
  { name: 'director-a', title: '紧凑短剧导演', type: 'director', description: '节奏与声音', enabled: true, version: 'd1' },
  { name: 'disabled-a', title: '旧审美', type: 'aesthetic', description: '已停用', enabled: false, version: 'a0' },
];

test('default direction and unchanged saved bindings do not depend on a failed picker catalog', () => {
  const saved = { aestheticSkillName: 'aesthetic-a', directorSkillName: 'director-a' };
  assert.equal(validateDramaSkillChanges(saved, saved, [], false).ready, true);
  assert.equal(validateDramaSkillChanges({ ...saved, directorSkillName: '' }, saved, [], false).ready, true);
});

test('new custom direction still requires a loaded and enabled catalog entry', () => {
  const saved = { aestheticSkillName: 'existing-aesthetic', directorSkillName: '' };
  const changed = { ...saved, directorSkillName: 'director-a' };
  assert.equal(validateDramaSkillChanges(changed, saved, [], false).ready, false);
  assert.equal(validateDramaSkillChanges(changed, saved, [], true).ready, false);
  assert.equal(validateDramaSkillChanges(changed, saved, catalog, true).ready, true);
  assert.equal(validateDramaSkillChanges(changed, saved, [{ ...catalog[1]!, enabled: false }], true).ready, false);
});

test('legacy projects do not auto-bind a new aesthetic or director skill', () => {
  const bindings = projectSkillBindings();
  assert.deepEqual(bindings, { aestheticSkillName: '', directorSkillName: '' });
  assert.equal(validateDramaSkillBindings(bindings, catalog, true).ready, true);
  assert.equal(dramaSkillBindingsChanged(bindings, {}), false);
});

test('new projects require an actual aesthetic selection instead of hardcoded presets', () => {
  assert.equal(validateDramaSkillBindings(projectSkillBindings(), catalog, true, true).ready, false);
  const bindings = { aestheticSkillName: 'aesthetic-a', directorSkillName: 'director-a' };
  const state = validateDramaSkillBindings(bindings, catalog, true, true);
  assert.equal(state.ready, true);
  assert.equal(state.aesthetic?.artStyle, 'chinese-3d');
  assert.equal(state.director?.name, 'director-a');
});

test('disabled, deleted and changed-type bindings remain explicit blocking errors', () => {
  const invalid = [
    { aestheticSkillName: 'disabled-a', directorSkillName: '' },
    { aestheticSkillName: 'deleted-a', directorSkillName: '' },
    { aestheticSkillName: 'director-a', directorSkillName: '' },
    { aestheticSkillName: '', directorSkillName: 'aesthetic-a' },
  ];
  for (const bindings of invalid) {
    assert.equal(validateDramaSkillBindings(bindings, catalog, true).ready, false);
    assert.equal(projectSkillBindings(bindings).aestheticSkillName, bindings.aestheticSkillName);
    assert.equal(projectSkillBindings(bindings).directorSkillName, bindings.directorSkillName);
  }
});

test('pending or failed catalog requests do not silently replace existing bindings', () => {
  const bindings = { aestheticSkillName: 'aesthetic-a', directorSkillName: 'director-a' };
  assert.equal(validateDramaSkillBindings(bindings, catalog, false).ready, false);
  assert.equal(validateDramaSkillBindings(bindings, [], false).ready, false);
  assert.deepEqual(projectSkillBindings(bindings), bindings);
});

test('changes and explicit clearing are compared with the saved project only', () => {
  const project = { aestheticSkillName: 'aesthetic-a', directorSkillName: 'director-a' };
  assert.equal(dramaSkillBindingsChanged(project, project), false);
  assert.equal(dramaSkillBindingsChanged({ ...project, directorSkillName: '' }, project), true);
  assert.equal(dramaSkillBindingsChanged({ aestheticSkillName: '', directorSkillName: '' }, project), true);
  assert.deepEqual(projectSkillBindings(project), project);
});

test('custom aesthetics display the real catalog title independently of compatibility artStyle and director validity', () => {
  const skills: ShortDramaSkill[] = [{ name: 'ink-style', title: '水墨木刻审美', type: 'aesthetic', description: '写意线条', enabled: true, artStyle: '', version: 'ink1' }];
  assert.equal(projectAestheticLabel({ aestheticSkillName: 'ink-style' }, skills, '电影写实'), '水墨木刻审美');
  assert.equal(projectAestheticLabel({ aestheticSkillName: 'ink-style' }, [{ ...skills[0], enabled: false }], '电影写实'), '水墨木刻审美');
  assert.equal(projectAestheticLabel({ aestheticSkillName: 'deleted' }, skills, '电影写实'), 'deleted（待核对）');
  assert.equal(projectAestheticLabel({}, skills, '国风三维动画'), '国风三维动画');
});
