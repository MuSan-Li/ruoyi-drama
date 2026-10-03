export interface PlanningCall {
  id: string; phase: string; label: string; state: string;
  startedAt: number; firstContentAt: number; lastActivityAt: number; endedAt: number;
  promptChars: number; contentChars: number; thinkingChars: number;
}
export interface PlanningCard {
  key: string; scene: number; ordinal: number; stage: 'draft' | 'planned' | 'ready';
  panel: Record<string, any>;
}
export interface PlanningProgress {
  requestId: string; phase: string; message: string; startedAt: number; updatedAt: number;
  calls: PlanningCall[]; cards: PlanningCard[];
}
export interface PlanningReceipt {
  projectId: string; scriptId: string; requestId?: string; state: string; terminal: boolean;
  activeLock: boolean; submittedAt?: number | string; error?: string; progress?: PlanningProgress;
}
export interface PlanningJob {
  projectId: string; scriptId: string; requestId: string; state: string; startedAt: number;
  progress?: PlanningProgress; message: string; queryError: string; lastCheckedAt: number;
}
export function planningKey(projectId: string, scriptId: string) { return `${projectId}:${scriptId}`; }
export function planningPending(job?: PlanningJob) {
  return !!job && !['done', 'error', 'not_observed'].includes(job.state);
}
/** Reject delayed callbacks from an earlier request, including old durable polling replies. */
export function applyPlanningReceipt(job: PlanningJob | undefined, receipt: PlanningReceipt): PlanningJob | undefined {
  if (job && (job.projectId !== String(receipt.projectId) || job.scriptId !== String(receipt.scriptId))) return job;
  if (job?.requestId && receipt.requestId && job.requestId !== receipt.requestId) return job;
  if (job && ['done', 'error'].includes(job.state) && !receipt.terminal) return job;
  if (receipt.state === 'not_observed' && job && planningPending(job)) return { ...job, lastCheckedAt: Date.now(), queryError: '' };
  if (!receipt.requestId && !receipt.activeLock && !job) return undefined;
  return {
    projectId: String(receipt.projectId), scriptId: String(receipt.scriptId), requestId: receipt.requestId || job?.requestId || '',
    state: receipt.state, startedAt: Number(receipt.submittedAt) || job?.startedAt || Date.now(),
    progress: receipt.progress || job?.progress, message: receipt.error || job?.message || '正在查询分镜任务',
    queryError: '', lastCheckedAt: Date.now(),
  };
}
export function upsertPlanningCard(cards: PlanningCard[], card: PlanningCard) {
  const ranks = { draft: 0, planned: 1, ready: 2 };
  const old = cards.find(entry => entry.key === card.key);
  if (old && ranks[old.stage] > ranks[card.stage]) return cards;
  return [...cards.filter(entry => entry.key !== card.key), card].sort((a, b) => a.scene - b.scene || a.ordinal - b.ordinal);
}
