import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectStoryboardAppearance } from '../src/utils/storyboardAppearance.ts';

const appearances = [
  { appearanceIndex: 1, changeReason: '宫廷礼服' },
  { appearanceIndex: 0, changeReason: '墨蓝常服' },
];

test('an imported numeric reference selects the stored index even when the list is reordered', () => {
  assert.equal(selectStoryboardAppearance(appearances, 0), appearances[1]);
  assert.equal(selectStoryboardAppearance(appearances, '0'), appearances[1]);
});

test('named references continue to match full and partial descriptions', () => {
  assert.equal(selectStoryboardAppearance(appearances, ' 墨蓝常服 '), appearances[1]);
  assert.equal(selectStoryboardAppearance(appearances, '常服'), appearances[1]);
});

test('missing, malformed, or unavailable references fall back without a render exception', () => {
  for (const reference of [undefined, null, {}, -1, 99, '未知造型']) {
    assert.equal(selectStoryboardAppearance(appearances, reference), appearances[0]);
  }
  assert.equal(selectStoryboardAppearance([], 0), undefined);
});
