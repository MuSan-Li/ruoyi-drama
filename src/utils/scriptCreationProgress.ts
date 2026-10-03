export interface ScriptProgress {
  state: string;
  startedAt: number;
  updatedAt: number;
  lastActivityAt: number;
  firstContentMs: number;
  firstScriptMs: number;
  elapsedMs: number;
  promptChars: number;
  contentChars: number;
  scriptChars: number;
  thinkingChars: number;
}

export interface ScriptCreationJob {
  id: string;
  state: 'running' | 'done' | 'error';
  startedAt: number;
  endedAt?: number;
  message: string;
  text: string;
  projectId?: string;
  completeReceived: boolean;
  error: string;
  progress?: ScriptProgress;
}

/** A progress milestone is not a saved-project receipt. Thinking content is never rendered. */
export function consumeScriptCreationEvent(job: ScriptCreationJob, event: string, data: Record<string, any>): ScriptCreationJob {
  if (job.state !== 'running') return job;
  if (event === 'progress') return { ...job, progress: data as ScriptProgress };
  if (event === 'phase') return { ...job, message: data.message || job.message };
  if (event === 'stream' && data.phase === 'script' && typeof data.text === 'string') return { ...job, text: job.text + data.text };
  if (event === 'complete' && /^\d+$/.test(String(data.projectId || ''))) return { ...job, completeReceived: true, projectId: String(data.projectId) };
  if (event === 'error') return { ...job, error: data.message || '剧本生成失败', projectId: data.projectId ? String(data.projectId) : job.projectId };
  return job;
}
