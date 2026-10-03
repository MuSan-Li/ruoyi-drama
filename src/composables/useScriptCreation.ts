import { computed, shallowRef, watch } from 'vue';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { requireShortDramaStreamComplete } from '@/utils/shortDramaResponse';
import { readDramaEventStream } from '@/utils/shortDramaEventStream';
import { consumeScriptCreationEvent, type ScriptCreationJob } from '@/utils/scriptCreationProgress';
import { useUserStore } from '@/stores/modules/user';

// Kept outside the selected project component: route changes never submit another request or stop reading the original stream.
const job = shallowRef<ScriptCreationJob>();
const busy = computed(() => job.value?.state === 'running');
let ownerToken: string | undefined;

export function useScriptCreation() {
  const user = useUserStore();
  function isolateSession(token: string | undefined) {
    if (ownerToken && token !== ownerToken) { job.value = undefined; ownerToken = undefined; }
  }
  isolateSession(user.token);
  watch(() => user.token, isolateSession);
  async function start(payload: Record<string, unknown>) {
    if (busy.value) throw new Error('初版剧本正在生成，请查看原任务');
    ownerToken = user.token;
    const id = crypto.randomUUID();
    job.value = { id, state: 'running', startedAt: Date.now(), message: '正在提交剧本生成请求', text: '', completeReceived: false, error: '' };
    try {
      const response = await authenticatedFetch(import.meta.env.VITE_API_URL + '/short-drama/create-from-idea/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}`, ClientID: import.meta.env.VITE_CLIENT_ID },
        body: JSON.stringify(payload),
      });
      await readDramaEventStream(response, (event, data) => {
        if (job.value?.id !== id) return;
        job.value = consumeScriptCreationEvent(job.value, event, data);
      });
      if (job.value?.id !== id) return; // The account may have changed while the original request was running.
      const current = job.value;
      if (current.error) throw new Error(current.error);
      requireShortDramaStreamComplete(current.completeReceived, current.projectId || null);
      job.value = { ...current, state: 'done', endedAt: Date.now(), message: '初版剧本已保存，请审阅正文' };
      return job.value;
    } catch (error) {
      if (job.value?.id === id) job.value = { ...job.value, state: 'error', endedAt: Date.now(), message: error instanceof Error ? error.message : '剧本请求未完成' };
      throw error;
    }
  }
  return { job, busy, start };
}
