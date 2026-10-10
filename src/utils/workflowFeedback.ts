export interface WorkflowRequest {
  requestId: string;
  projectId: string | null;
  operation: string;
  endpoint: string;
  summary: Record<string, string | number | boolean | null>;
}

export interface WorkflowFailure extends WorkflowRequest {
  recordedAt: string;
  message: string;
  resolved: boolean;
  httpStatus?: number;
  contentType?: string;
  businessCode?: number | string;
}

type FailureDetails = Pick<WorkflowFailure, 'message' | 'httpStatus' | 'contentType' | 'businessCode'>;
type FeedbackStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const STORAGE_KEY = 'ruoyi-drama:workflow-failures';

export function workflowFailureMessage(failure: WorkflowFailure) {
  if (/AuthenticationException|["']code["']\s*:\s*401|\bunauthorized\b/i.test(failure.message)) {
    return `${failure.operation}未完成：Atlas 模型鉴权失败，请检查后台该模型的 API Key、接口地址和账号权限。`;
  }
  return `${failure.operation}未完成：${failure.message}`;
}

/** Persist diagnostics, but never restore a historical failure as a current task status. */
export function createWorkflowFeedback(storage?: FeedbackStorage) {
  let records: WorkflowFailure[] = [];
  const latest = new Map<string, string>();
  const scope = (operation: string, projectId: string | null) => JSON.stringify([operation, projectId]);
  try {
    const saved: unknown = JSON.parse(storage?.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(saved)) records = saved.filter(item => item && typeof item.message === 'string'
      && typeof item.operation === 'string').slice(-10).map(item => ({ ...item, resolved: true }));
  } catch { /* Malformed diagnostics must not affect the editor. */ }
  function save() {
    try { storage?.setItem(STORAGE_KEY, JSON.stringify(records)); } catch { /* Keep in-memory feedback. */ }
  }
  function resolve(operation: string, projectId: string | null) {
    latest.delete(scope(operation, projectId));
    records = records.map(item => item.operation === operation && item.projectId === projectId
      ? { ...item, resolved: true } : item);
    save();
  }
  return {
    get records() { return records; },
    begin(operation: string, endpoint: string, projectId: string | null, summary: WorkflowRequest['summary']): WorkflowRequest {
      resolve(operation, projectId);
      const request = { requestId: crypto.randomUUID(), operation, endpoint, projectId, summary: { ...summary, projectId } };
      latest.set(scope(operation, projectId), request.requestId);
      return request;
    },
    fail(request: WorkflowRequest, details: FailureDetails) {
      records = [...records, { ...request, ...details, recordedAt: new Date().toISOString(),
        resolved: latest.get(scope(request.operation, request.projectId)) !== request.requestId }].slice(-10);
      save();
    },
    complete(request: WorkflowRequest) {
      if (latest.get(scope(request.operation, request.projectId)) !== request.requestId) return;
      latest.delete(scope(request.operation, request.projectId));
      resolve(request.operation, request.projectId);
    },
    resolve,
    current(projectId: string | null) {
      return [...records].reverse().find(item => !item.resolved && item.projectId === projectId);
    },
    dismiss(projectId: string | null) {
      records = records.map(item => {
        if (item.projectId !== projectId) return item;
        latest.delete(scope(item.operation, projectId));
        return { ...item, resolved: true };
      });
      save();
    },
    reset() {
      records = [];
      latest.clear();
      try { storage?.removeItem(STORAGE_KEY); } catch { /* Clear the visible state regardless. */ }
    },
  };
}
