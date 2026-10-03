import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  IMAGE_MODEL_KEY, IMAGE_MODEL_POLICY, SEEDREAM_IMAGE_MODEL,
  resolveImageModel, restoreImageModelPreference, saveImageModelPreference,
} from '../src/utils/imageModelPreference.ts';

const oldT2I = 'bytedance/seedream-v4.5/text-to-image';
const edit = 'bytedance/seedream-v4.7/edit';
const available = [oldT2I, edit, SEEDREAM_IMAGE_MODEL];

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: (key: string) => key === IMAGE_MODEL_KEY ? value : null,
    setItem: (key: string, next: string) => { if (key === IMAGE_MODEL_KEY) value = next; },
  };
}

test('new and old preferences migrate to the exact 4.7 text-to-image model', () => {
  assert.equal(resolveImageModel(available), SEEDREAM_IMAGE_MODEL);
  assert.equal(resolveImageModel(available, oldT2I), SEEDREAM_IMAGE_MODEL);
  assert.equal(resolveImageModel(available, { policy: 'older-policy', modelName: oldT2I }), SEEDREAM_IMAGE_MODEL);
});

test('missing 4.7 never silently chooses an older text-to-image or an edit model', () => {
  assert.equal(resolveImageModel([oldT2I, edit]), '');
  assert.equal(resolveImageModel([]), '');
});

test('a manual choice after migration persists, including when model catalog order changes', () => {
  const storage = memoryStorage(JSON.stringify(oldT2I));
  assert.equal(restoreImageModelPreference(available, storage), SEEDREAM_IMAGE_MODEL);
  saveImageModelPreference(oldT2I, storage);
  assert.equal(restoreImageModelPreference([...available].reverse(), storage), oldT2I);
  assert.deepEqual(JSON.parse(storage.getItem(IMAGE_MODEL_KEY)!), { policy: IMAGE_MODEL_POLICY, modelName: oldT2I });
});

test('a removed explicit model blocks generation instead of silently changing paid requests', () => {
  const storage = memoryStorage();
  saveImageModelPreference(oldT2I, storage);
  assert.equal(restoreImageModelPreference([SEEDREAM_IMAGE_MODEL], storage), '');
  assert.equal(JSON.parse(storage.getItem(IMAGE_MODEL_KEY)!).modelName, oldT2I);
});

test('corrupt storage is repaired only when the preferred model becomes available', () => {
  const storage = memoryStorage('{corrupt');
  assert.equal(restoreImageModelPreference([oldT2I], storage), '');
  assert.equal(storage.getItem(IMAGE_MODEL_KEY), '{corrupt');
  assert.equal(restoreImageModelPreference(available, storage), SEEDREAM_IMAGE_MODEL);
  assert.equal(JSON.parse(storage.getItem(IMAGE_MODEL_KEY)!).modelName, SEEDREAM_IMAGE_MODEL);
});

test('denied browser storage still selects the exact configured model without throwing', () => {
  const storage = {
    getItem: () => { throw new Error('storage unavailable'); },
    setItem: () => { throw new Error('storage unavailable'); },
  };
  assert.equal(restoreImageModelPreference(available, storage), SEEDREAM_IMAGE_MODEL);
  assert.doesNotThrow(() => saveImageModelPreference(oldT2I, storage));
});
