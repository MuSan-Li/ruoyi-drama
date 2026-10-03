import { shallowRef } from 'vue';
import type { ShortDramaStoryboard } from '@/api/shortDrama/types';
import {
  parsePendingVideoSubmissions,
  VIDEO_SUBMISSION_STORAGE_KEY,
  videoSubmissionConfirmed,
  type PendingVideoSubmission,
} from '@/utils/storyboardVideoSubmission';

/** Browser request IDs survive reloads until the backend acknowledges the attempt. */
export function useStoryboardVideoSubmission() {
  const submissions = shallowRef<PendingVideoSubmission[]>([]);

  function sync() {
    try { submissions.value = parsePendingVideoSubmissions(localStorage.getItem(VIDEO_SUBMISSION_STORAGE_KEY)); }
    catch { /* The in-memory guard still applies when browser storage is unavailable. */ }
  }
  function persist() {
    try { localStorage.setItem(VIDEO_SUBMISSION_STORAGE_KEY, JSON.stringify(submissions.value)); }
    catch { /* Keep the request ID in memory and in the backend submission journal. */ }
  }
  function pending(shot: ShortDramaStoryboard) {
    return submissions.value.find(entry => entry.projectId === shot.projectId && entry.storyboardId === shot.id);
  }
  function begin(shot: ShortDramaStoryboard, model: string, regenerate: boolean) {
    sync();
    const existing = pending(shot);
    if (existing) return existing;
    if (!shot.id) throw new Error('镜头尚未保存');
    const record: PendingVideoSubmission = {
      projectId: shot.projectId,
      storyboardId: shot.id,
      requestId: crypto.randomUUID(),
      model,
      regenerate,
      status: 'submitting',
      createdAt: Date.now(),
      previousVideoId: shot.videoId,
      previousStatus: shot.videoStatus,
      previousUpdateTime: shot.updateTime,
    };
    submissions.value = [...submissions.value, record];
    persist();
    return record;
  }
  function markUnknown(shot: ShortDramaStoryboard) {
    const record = pending(shot);
    if (!record) return;
    submissions.value = submissions.value.map(entry => entry === record ? { ...entry, status: 'unknown' } : entry);
    persist();
  }
  function markSubmitting(shot: ShortDramaStoryboard) {
    const record = pending(shot);
    if (!record) return;
    submissions.value = submissions.value.map(entry => entry === record ? { ...entry, status: 'submitting' } : entry);
    persist();
  }
  function resolveNotSubmitted(shot: ShortDramaStoryboard) {
    const record = pending(shot);
    if (!record) return;
    submissions.value = submissions.value.filter(entry => entry !== record);
    persist();
  }
  function reconcile(shot: ShortDramaStoryboard, acknowledged = false) {
    const record = pending(shot);
    if (!record || !videoSubmissionConfirmed(record, shot, acknowledged)) return;
    submissions.value = submissions.value.filter(entry => entry !== record);
    persist();
  }

  sync();
  return { sync, pending, begin, markUnknown, markSubmitting, resolveNotSubmitted, reconcile };
}
