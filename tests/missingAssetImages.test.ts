import { test } from 'node:test';
import assert from 'node:assert/strict';
import { needsAssetImage } from '../src/utils/missingAssetImages.ts';

test('one-click generation only includes identified assets with no media', () => {
  assert.equal(needsAssetImage({ id: '1' }, 'appearance-1', {}, {}), true);
  assert.equal(needsAssetImage({ id: '1', imageUrls: '[]' }, 'appearance-1', {}, {}), true);
  assert.equal(needsAssetImage({}, 'appearance-1', {}, {}), false);
  assert.equal(needsAssetImage({ id: '1', referenceImageUrl: 'approved.jpg' }, 'appearance-1', {}, {}), false);
  assert.equal(needsAssetImage({ id: '1', imageUrls: '["candidate.jpg"]' }, 'appearance-1', {}, {}), false);
});

test('ongoing and unknown receipts survive retries and cannot cause another paid submission', () => {
  assert.equal(needsAssetImage({ id: '1' }, 'appearance-1', { 'appearance-1': { predictionId: 'old-task' } }, {}), false);
  assert.equal(needsAssetImage({ id: '1' }, 'appearance-1', {}, { 'appearance-1': true }), false);
  assert.equal(needsAssetImage({ id: '1', imageUrls: 'malformed' }, 'appearance-1', {}, {}), false);
  assert.equal(needsAssetImage({ id: '1', imageUrls: '{}' }, 'appearance-1', {}, {}), false);
});
