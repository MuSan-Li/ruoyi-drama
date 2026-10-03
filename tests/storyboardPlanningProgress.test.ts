import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyPlanningReceipt, planningPending, upsertPlanningCard, type PlanningJob } from '../src/utils/storyboardPlanningProgress.ts';
const job: PlanningJob = { projectId: 'project', scriptId: 'script', requestId: 'original', state: 'running', startedAt: 1, message: '', queryError: '', lastCheckedAt: 0 };
test('lost SSE and missing status do not permit duplicate submission', () => {
  const next = applyPlanningReceipt(job, { projectId: 'project', scriptId: 'script', state: 'not_observed', terminal: false, activeLock: false });
  assert.equal(planningPending(next), true); assert.equal(next?.requestId, 'original');
  assert.equal(planningPending({ ...job, state: 'submission_unknown' }), true);
});
test('another project, delayed request and late running callback cannot replace the job', () => {
  const receipt = { projectId: 'project', scriptId: 'script', requestId: 'original', state: 'done', terminal: true, activeLock: false };
  assert.equal(applyPlanningReceipt(job, { ...receipt, projectId: 'other' }), job);
  assert.equal(applyPlanningReceipt(job, { ...receipt, requestId: 'old-request' }), job);
  const done = applyPlanningReceipt(job, receipt)!;
  assert.equal(planningPending(done), false);
  assert.equal(applyPlanningReceipt(done, { ...receipt, state: 'running', terminal: false }), done);
});
test('scene-local cards retain deterministic order and readiness wins over delayed previews', () => {
  const ready = { key: '2:1', scene: 2, ordinal: 1, stage: 'ready' as const, panel: { description: '回正' } };
  const cards = upsertPlanningCard([ready], { ...ready, stage: 'draft', panel: { description: '旧草稿' } });
  assert.equal(cards[0], ready);
  assert.equal(upsertPlanningCard(cards, { ...ready, key: '1:3', scene: 1, ordinal: 3 })[0].key, '1:3');
});
