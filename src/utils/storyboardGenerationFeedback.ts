import type { PlanningCard } from './storyboardPlanningProgress.ts';

/** Estimates come from the actual returned plan, never a percentage or a default runtime. */
export function storyboardEstimate(cards: PlanningCard[]) {
  const seconds = cards.map(card => Number(card.panel.duration));
  if (!seconds.length || seconds.some(value => !Number.isInteger(value) || value <= 0)) return undefined;
  return seconds.reduce((sum, value) => sum + value, 0);
}

export function storyboardFailureSummary(message: string) {
  const shot = message.match(/镜头(\d+)/)?.[1];
  if (/状态校对|物理状态|物理锚点|state_delta|state_in|cut_in|专业分镜/.test(message))
    return `${shot ? `镜头 ${shot} 的` : ''}前后动作或角色状态没有接好，本次生成已停止。可重新生成，原有素材保留。`;
  if (/遗漏或乱序.*对白/.test(message)) return '分镜漏掉了对白或打乱了说话顺序，本次未保存。可重新生成，原有素材保留。';
  if (/本场预计|规划为|时长/.test(message)) return '分镜的时长安排没有通过检查，本次未保存。可核对剧本后重新生成。';
  return message || '分镜生成未完成。本次草稿未保存，可重新生成。';
}
