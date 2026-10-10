import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWorkflowFeedback, workflowFailureMessage } from '../src/utils/workflowFeedback.ts';

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); } };
}

test('historical failures remain downloadable without reappearing after successful media or reload', () => {
  const storage = memoryStorage();
  const feedback = createWorkflowFeedback(storage);
  const request = feedback.begin('剧本创作', '/create', null, {});
  feedback.fail(request, { message: 'AuthenticationException: unauthorized' });
  assert.ok(feedback.current(null));
  assert.equal(feedback.current('completed-project'), undefined);
  const reloaded = createWorkflowFeedback(storage);
  assert.equal(reloaded.records.length, 1);
  assert.equal(reloaded.current(null), undefined);
  assert.equal(reloaded.current('completed-project'), undefined);
});

test('switching projects and closing feedback cannot affect another project failure', () => {
  const feedback = createWorkflowFeedback();
  for (const project of ['A', 'B']) {
    const request = feedback.begin('资产分析', '/analyze', project, { projectId: 'wrong-current-project' });
    feedback.fail(request, { message: project });
  }
  assert.equal(feedback.current('A')?.summary.projectId, 'A');
  feedback.dismiss('B');
  assert.equal(feedback.current('B'), undefined);
  assert.equal(feedback.current('A')?.message, 'A');
});

test('retry and success clear only matching operation while late failures cannot replace success', () => {
  const feedback = createWorkflowFeedback();
  const old = feedback.begin('资产分析', '/analyze', 'A', {});
  feedback.fail(old, { message: 'old failure' });
  const retry = feedback.begin('资产分析', '/analyze', 'A', {});
  assert.equal(feedback.current('A'), undefined);
  const other = feedback.begin('分镜生成', '/plan', 'A', {});
  feedback.fail(other, { message: 'plan failure' });
  feedback.complete(retry);
  feedback.fail(old, { message: 'late failure' });
  assert.equal(feedback.current('A')?.message, 'plan failure');
  feedback.resolve('分镜生成', 'A');
  feedback.fail(other, { message: 'late after status recovery' });
  assert.equal(feedback.current('A'), undefined);
});

test('malformed and legacy history never creates an active task failure', () => {
  const storage = memoryStorage();
  storage.setItem('ruoyi-drama:workflow-failures', JSON.stringify([null, {}, { operation: '剧本创作', message: 'legacy' }]));
  const feedback = createWorkflowFeedback(storage);
  assert.equal(feedback.records.length, 1);
  assert.equal(feedback.current(null), undefined);
  feedback.reset();
  assert.equal(storage.getItem('ruoyi-drama:workflow-failures'), null);
});

test('model authentication errors explain Atlas credentials without showing an SDK stack to the author', () => {
  const feedback = createWorkflowFeedback();
  feedback.fail(feedback.begin('剧本创作', '/create', null, {}), { message: '剧本生成失败：dev.langchain4j.exception.AuthenticationException: {"code":401,"msg":"unauthorized"}' });
  assert.match(workflowFailureMessage(feedback.current(null)!), /Atlas 模型鉴权失败/);
  assert.doesNotMatch(workflowFailureMessage(feedback.current(null)!), /langchain4j/);
});
