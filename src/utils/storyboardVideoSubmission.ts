import type { ShortDramaStoryboard } from '../api/shortDrama/types';

export interface PendingVideoSubmission {
  projectId: string;
  storyboardId: string;
  requestId: string;
  model: string;
  regenerate: boolean;
  status: 'submitting' | 'unknown';
  createdAt: number;
  previousVideoId?: string;
  previousStatus?: string;
  previousUpdateTime?: string;
}

export const VIDEO_SUBMISSION_STORAGE_KEY = 'ruoyi-drama:video-submissions';

export function isLocalVideoTask(videoId?: string) {
  return /^local[:-]/.test(videoId || '');
}

/** A transport failure cannot establish that a paid provider submission failed. */
export function isUnresolvedVideoTask(shot: ShortDramaStoryboard) {
  return ['generating', 'submitting', 'submission_unknown'].includes(shot.videoStatus || '')
    || isLocalVideoTask(shot.videoId);
}

export function videoSubmissionConfirmed(record: PendingVideoSubmission, shot: ShortDramaStoryboard, acknowledged = false) {
  if (isLocalVideoTask(shot.videoId) || shot.videoStatus === 'submission_unknown' || shot.videoStatus === 'submitting') return false;
  if (shot.videoStatus === 'generating') return !!shot.videoId;
  if (!['done', 'failed'].includes(shot.videoStatus || '')) return false;
  // Reading an unchanged old completed/failed row after a timeout is not an acknowledgement
  // of a new attempt. This is especially important when regenerating an existing video.
  return acknowledged || shot.videoId !== record.previousVideoId
    || shot.videoStatus === 'failed' && record.previousStatus !== 'failed'
      && !!shot.updateTime && shot.updateTime !== record.previousUpdateTime;
}

/** null is a confirmed absent receipt; undefined means it has not been queried. */
export function videoSubmissionRecoveryAllowed(record: PendingVideoSubmission | undefined, receiptStatus: string | null | undefined, shot: ShortDramaStoryboard) {
  return record?.status === 'unknown' && receiptStatus === null && !isUnresolvedVideoTask(shot)
    && shot.videoId === record.previousVideoId && shot.updateTime === record.previousUpdateTime;
}

export function parsePendingVideoSubmissions(raw: string | null): PendingVideoSubmission[] {
  try {
    const value: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is PendingVideoSubmission => {
      if (!entry || typeof entry !== 'object') return false;
      const row = entry as Record<string, unknown>;
      return typeof row.projectId === 'string' && typeof row.storyboardId === 'string'
        && typeof row.requestId === 'string' && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(row.requestId)
        && typeof row.model === 'string' && typeof row.regenerate === 'boolean'
        && (row.status === 'submitting' || row.status === 'unknown')
        && typeof row.createdAt === 'number' && Number.isFinite(row.createdAt);
    });
  } catch { return []; }
}
