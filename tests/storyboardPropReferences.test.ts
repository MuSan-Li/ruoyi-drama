import assert from 'node:assert/strict';
import { test } from 'node:test';
import { storyboardPropNames } from '../src/utils/storyboardPropReferences.ts';

const assets = [
  { kind: 'prop', title: '旧炮与朽车架', shotNumbers: [14, 15] },
  { kind: 'prop', title: '护城炮成品', shotNumbers: [51, 68, 78] },
  { kind: 'prop', title: '未关联候选', shotNumbers: [] },
  { kind: 'archived_prop', title: '旧候选', shotNumbers: [51] },
];

test('existing per-asset shot bindings display the same props as video generation', () => {
  assert.deepEqual(storyboardPropNames(undefined, 51, assets), ['护城炮成品']);
  assert.deepEqual(storyboardPropNames(undefined, 15, assets), ['旧炮与朽车架']);
  assert.deepEqual(storyboardPropNames(undefined, 1, assets), []);
});
test('an explicit empty visible list suppresses legacy shot links', () => {
  assert.deepEqual(storyboardPropNames([], 51, assets), []);
});
test('explicit names replace legacy links and keep unready names for placeholders', () => {
  assert.deepEqual(storyboardPropNames(['待生成道具', '待生成道具'], 51, assets), ['待生成道具']);
});
test('a legacy null visible list falls back without adding unbound or archived assets', () => {
  assert.deepEqual(storyboardPropNames(null, 51, assets), ['护城炮成品']);
});
