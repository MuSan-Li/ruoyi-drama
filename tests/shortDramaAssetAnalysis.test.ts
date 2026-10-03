import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requireAnalyzedAssets } from '../src/utils/shortDramaAssetAnalysis.ts';

test('empty or invalid successful envelopes fail before replacing existing assets', () => {
  const existing = { characters: [{ name: '已审阅主角' }], locations: [{ name: '已审阅县衙' }] };
  for (const result of [undefined, {}, { characters: [], locations: [] }, { characters: [{ name: '朱承晏' }], locations: [] }, { characters: [{ name: ' ' }], locations: [{ name: '县衙' }] }]) {
    assert.throws(() => requireAnalyzedAssets(result), /资产分析未返回/);
    assert.equal(existing.characters[0].name, '已审阅主角');
    assert.equal(existing.locations[0].name, '已审阅县衙');
  }
});

test('valid named roles and scenes pass without rewriting approved asset fields', () => {
  const result = { characters: [{ name: '朱承晏', referenceImageUrl: 'approved-character' }], locations: [{ name: '县衙', referenceImageUrl: 'approved-location' }] };
  const assets = requireAnalyzedAssets(result);
  assert.equal(assets.characters, result.characters);
  assert.equal(assets.locations, result.locations);
});
