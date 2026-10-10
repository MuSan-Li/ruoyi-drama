import { computed, shallowRef, watch, type Ref } from 'vue';
import { useUserStore } from '@/stores/modules/user';
import { ShortDramaResponseError } from '@/utils/shortDramaResponse';
import { createWorkflowFeedback, workflowFailureMessage, type WorkflowRequest } from '@/utils/workflowFeedback';

export function useWorkflowFeedback(project: Ref<string | null>) {
  let storage: Storage | undefined;
  try { storage = sessionStorage; } catch { /* Private browsing may disable storage. */ }
  const feedback = createWorkflowFeedback(storage);
  const records = shallowRef(feedback.records);
  const sync = () => { records.value = [...feedback.records]; };
  const message = computed(() => {
    void records.value;
    const failure = feedback.current(project.value);
    return failure ? workflowFailureMessage(failure) : '';
  });
  watch(() => useUserStore().token, () => { feedback.reset(); sync(); });
  return {
    records, message,
    begin(operation: string, endpoint: string, summary: WorkflowRequest['summary'], projectId = project.value) {
      const request = feedback.begin(operation, endpoint, projectId, summary); sync(); return request;
    },
    fail(request: WorkflowRequest, error: unknown) {
      feedback.fail(request, { message: error instanceof Error ? error.message : '请求中断，生成结果尚未确认',
        ...(error instanceof ShortDramaResponseError ? { httpStatus: error.httpStatus, contentType: error.contentType, businessCode: error.businessCode } : {}) });
      sync();
    },
    complete(request: WorkflowRequest) { feedback.complete(request); sync(); },
    resolve(operation: string, projectId: string | null) { feedback.resolve(operation, projectId); sync(); },
    dismiss() { feedback.dismiss(project.value); sync(); },
  };
}
