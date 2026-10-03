import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveWritingModel, DOUBAO_WRITING_MODEL } from '../src/utils/writingModelPreference.ts';
test('new workspace uses configured Doubao while explicit available preferences survive refresh', () => {
  const models = ['deepseek', DOUBAO_WRITING_MODEL];
  assert.equal(resolveWritingModel(models), DOUBAO_WRITING_MODEL);
  assert.equal(resolveWritingModel(models, '', 'deepseek'), 'deepseek');
  assert.equal(resolveWritingModel(models, 'deepseek', DOUBAO_WRITING_MODEL), 'deepseek');
});
test('removed models and empty catalogs never leave an invalid selection', () => {
  assert.equal(resolveWritingModel(['valid'], 'removed', 'also-removed'), 'valid');
  assert.equal(resolveWritingModel([], DOUBAO_WRITING_MODEL), '');
});
