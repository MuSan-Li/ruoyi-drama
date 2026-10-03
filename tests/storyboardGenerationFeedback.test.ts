import test from 'node:test';
import assert from 'node:assert/strict';
import { storyboardEstimate, storyboardFailureSummary } from '../src/utils/storyboardGenerationFeedback.ts';
import type { PlanningCard } from '../src/utils/storyboardPlanningProgress.ts';

test('reports actual returned durations only, without inventing an estimate for missing fields', () => {
  const card = (duration?: number): PlanningCard => ({ key: '1', scene: 1, ordinal: 1, stage: 'planned', panel: { duration } });
  assert.equal(storyboardEstimate([card(9), card(11)]), 20);
  assert.equal(storyboardEstimate([card(9), card()]), undefined);
  assert.equal(storyboardEstimate([]), undefined);
});

test('explains terminal continuity failure and keeps the failing shot recognizable', () => {
  const message = storyboardFailureSummary('第1场失败：镜头5连续状态校对未完成：缺少锚点[飞廉.姿态]；多出锚点[]');
  assert.match(message, /镜头 5/); assert.match(message, /已停止/); assert.match(message, /原有素材保留/);
  assert.doesNotMatch(message, /仍在后台|继续等待/);
  assert.match(storyboardFailureSummary('状态校对首镜须覆盖全段原锚点且不得改名：[夸父.位置]'), /状态没有接好/);
});

test('unknown provider errors remain visible instead of becoming a continuity diagnosis', () => {
  assert.equal(storyboardFailureSummary('模型调用失败：限流，请稍后再试'), '模型调用失败：限流，请稍后再试');
});
