import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appearancePreview, characterPreview } from '../src/utils/characterPresentation.ts';

test('portrait uses the selected image and never changes persisted candidate indices', () => {
  const appearance = { imageUrls: '[null,"old.jpg","selected.jpg"]', selectedImageIndex: 2 };
  assert.equal(appearancePreview(appearance).url, 'selected.jpg');
  assert.equal(appearancePreview(appearance).selected, true);
  assert.equal(appearance.selectedImageIndex, 2);
  assert.equal(appearance.imageUrls, '[null,"old.jpg","selected.jpg"]');
});

test('invalid or missing selections show a candidate without claiming it is selected', () => {
  for (const selectedImageIndex of [-1, 8, 0.5, undefined]) {
    const result = appearancePreview({ imageUrls: '["candidate.jpg"]', selectedImageIndex });
    assert.equal(result.url, 'candidate.jpg');
    assert.equal(result.selected, false);
  }
  assert.equal(appearancePreview({ imageUrls: 'malformed' }).url, '');
  assert.equal(appearancePreview({ imageUrls: '{}' }).count, 0);
});

test('character overview prioritizes a selected version and labels original references separately', () => {
  assert.equal(characterPreview({ name: '角色', appearances: [{ imageUrls: '["candidate.jpg"]' }, { imageUrls: '["chosen.jpg"]', selectedImageIndex: 0 }] }).url, 'chosen.jpg');
  const reference = characterPreview({ name: '角色', referenceImageUrl: 'original.jpg' });
  assert.equal(reference.url, 'original.jpg');
  assert.equal(reference.source, 'reference');
  assert.equal(reference.selected, false);
});
