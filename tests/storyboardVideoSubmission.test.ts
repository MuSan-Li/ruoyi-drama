import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isLocalVideoTask,
  isUnresolvedVideoTask,
  parsePendingVideoSubmissions,
  videoSubmissionConfirmed,
  videoSubmissionRecoveryAllowed,
  type PendingVideoSubmission,
} from '../src/utils/storyboardVideoSubmission.ts';

const record: PendingVideoSubmission = {
  projectId: 'project', storyboardId: 'shot', requestId: 'f09e0cd7-071f-44ab-b210-26920ced3fc8',
  model: 'submitted-model', regenerate: true, status: 'unknown', createdAt: 1,
  previousVideoId: 'approved-video', previousStatus: 'done', previousUpdateTime: 'before',
};
const shot = { projectId: 'project', scriptId: 'script', sceneNo: 1 };

test('in-flight, ambiguous, and local tasks cannot be submitted as a new generation', () => {
  for (const videoStatus of ['generating', 'submitting', 'submission_unknown']) {
    assert.equal(isUnresolvedVideoTask({ ...shot, videoStatus }), true);
  }
  assert.equal(isUnresolvedVideoTask({ ...shot, videoStatus: 'failed', videoId: 'local:request' }), true);
  assert.equal(isLocalVideoTask('local-legacy-request'), true);
  assert.equal(isLocalVideoTask('provider-request'), false);
  assert.equal(isUnresolvedVideoTask({ ...shot, videoStatus: 'failed', videoId: 'provider-request' }), false);
});

test('an old completed row does not resolve a lost acknowledgement of regeneration', () => {
  const unchanged = { ...shot, videoStatus: 'done', videoId: 'approved-video', updateTime: 'before' };
  assert.equal(videoSubmissionConfirmed(record, unchanged), false);
  assert.equal(videoSubmissionConfirmed(record, unchanged, true), true);
  assert.equal(videoSubmissionConfirmed(record, { ...unchanged, updateTime: 'unrelated-edit' }), false);
  assert.equal(videoSubmissionConfirmed(record, { ...unchanged, videoId: 'new-provider-video' }), true);
  assert.equal(videoSubmissionConfirmed(record, { ...unchanged, videoStatus: 'failed', updateTime: 'after' }), true);
  assert.equal(videoSubmissionConfirmed({ ...record, previousStatus: 'failed' }, { ...unchanged, videoStatus: 'failed', updateTime: 'after' }), false);
});

test('only a real provider ID acknowledges generating; local or unknown replies keep the request ID', () => {
  assert.equal(videoSubmissionConfirmed(record, { ...shot, videoStatus: 'generating', videoId: 'local:request' }, true), false);
  assert.equal(videoSubmissionConfirmed(record, { ...shot, videoStatus: 'submission_unknown', videoId: 'provider-request' }, true), false);
  assert.equal(videoSubmissionConfirmed(record, { ...shot, videoStatus: 'generating', videoId: 'provider-request' }), true);
  assert.equal(videoSubmissionConfirmed(record, { ...shot, videoStatus: 'pending' }), false);
});

test('browser reload preserves the same request ID and rejects corrupt records', () => {
  assert.deepEqual(parsePendingVideoSubmissions(JSON.stringify([record])), [record]);
  assert.deepEqual(parsePendingVideoSubmissions(JSON.stringify([{ ...record, requestId: 'invalid' }, null])), []);
  assert.deepEqual(parsePendingVideoSubmissions('{broken'), []);
  assert.deepEqual(parsePendingVideoSubmissions(null), []);
});

test('same-request recovery is offered only after an absent receipt was observed and no backend task is active', () => {
  const original = { ...shot, videoStatus: 'done', videoId: 'approved-video', updateTime: 'before' };
  assert.equal(videoSubmissionRecoveryAllowed(record, null, original), true);
  assert.equal(videoSubmissionRecoveryAllowed(record, null, { ...original, updateTime: 'edited' }), false);
  assert.equal(videoSubmissionRecoveryAllowed(record, undefined, shot), false);
  assert.equal(videoSubmissionRecoveryAllowed(record, 'submission_unknown', shot), false);
  assert.equal(videoSubmissionRecoveryAllowed(record, 'done', shot), false);
  assert.equal(videoSubmissionRecoveryAllowed(record, null, { ...shot, videoStatus: 'generating', videoId: 'local:request' }), false);
  assert.equal(videoSubmissionRecoveryAllowed({ ...record, status: 'submitting' }, null, shot), false);
});
