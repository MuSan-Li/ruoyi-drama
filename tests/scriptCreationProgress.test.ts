import { test } from 'node:test';
import assert from 'node:assert/strict';
import { consumeScriptCreationEvent, type ScriptCreationJob } from '../src/utils/scriptCreationProgress.ts';

const initial = (): ScriptCreationJob => ({ id: 'local', state: 'running', startedAt: 1000, message: '', text: '', completeReceived: false, error: '' });
test('thinking is ignored and actual script chunks remain ordered', () => {
  let job = consumeScriptCreationEvent(initial(), 'stream', { phase: 'thinking', text: 'private reasoning' });
  job = consumeScriptCreationEvent(job, 'stream', { phase: 'script', text: '一 山谷。' });
  job = consumeScriptCreationEvent(job, 'stream', { phase: 'script', text: '匠人御风。' });
  assert.equal(job.text, '一 山谷。匠人御风。');
});
test('only a real complete event acknowledges a saved project', () => {
  let job = consumeScriptCreationEvent(initial(), 'progress', { state: 'done', scriptChars: 500 });
  assert.equal(job.completeReceived, false);
  job = consumeScriptCreationEvent(job, 'complete', { projectId: '2100000000000000001' });
  assert.equal(job.completeReceived, true); assert.equal(job.projectId, '2100000000000000001');
  assert.equal(job.state, 'running'); // Stream errors after a complete event must still be checked.
});
test('late events never modify an ended job', () => {
  const job = { ...initial(), state: 'done' as const };
  assert.equal(consumeScriptCreationEvent(job, 'stream', { phase: 'script', text: 'late' }), job);
});
