import { computed, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { ShortDramaResponseError } from '@/utils/shortDramaResponse';
import { readDramaEventStream } from '@/utils/shortDramaEventStream';
import { useUserStore } from '@/stores/modules/user';
import { applyPlanningReceipt, planningKey, planningPending, upsertPlanningCard } from '@/utils/storyboardPlanningProgress';
import type { PlanningJob, PlanningReceipt } from '@/utils/storyboardPlanningProgress';

/** Job identity belongs to its project/script, independently of the selected workflow page. */
export function useTextGeneration(projectId: Ref<string | null>, scriptId: () => string | undefined, onCompleted: (project: string) => Promise<void>, options: {
  label: string; endpoint: 'analyze-assets' | 'plan-storyboard';
  status: (project: string, script: string, request?: string) => Promise<PlanningReceipt>;
}) {
  const user = useUserStore();
  const jobs = shallowRef<Record<string, PlanningJob>>({});
  const now = ref(Date.now());
  const querying = ref(false);
  const currentKey = computed(() => projectId.value && scriptId() ? planningKey(projectId.value, scriptId()!) : '');
  const current = computed(() => jobs.value[currentKey.value]);
  const busy = computed(() => planningPending(current.value));
  let disposed = false;
  const inFlight = new Map<string, Promise<void>>();
  watch(() => user.token, () => { jobs.value = {}; });
  function put(key: string, job: PlanningJob | undefined) { if (job) jobs.value = { ...jobs.value, [key]: job }; }
  function accept(project: string, script: string, receipt: PlanningReceipt) {
    const key = planningKey(project, script), before = jobs.value[key];
    const job = applyPlanningReceipt(before, receipt); put(key, job);
    if (job?.state === 'done' && (before?.state !== 'done' || before.queryError) && !disposed) {
      void onCompleted(project).catch(error => {
        if (jobs.value[key]?.requestId === job.requestId) put(key, { ...job, queryError: error instanceof Error ? error.message : '结果已保存，页面回读失败，请重新查询' });
      });
    }
    return job;
  }
  async function query(project = projectId.value, script = scriptId()) {
    if (!project || !script || disposed) return;
    const key = planningKey(project, script);
    if (inFlight.has(key)) { await inFlight.get(key); return; }
    const request = jobs.value[key]?.requestId;
    let settle: () => void = () => {};
    inFlight.set(key, new Promise<void>(resolve => { settle = resolve; })); querying.value = true;
    try {
      const receipt = await options.status(project, script, request);
      if (!disposed) accept(project, script, receipt);
    } catch (error) {
      const job = jobs.value[key];
      if (!disposed && job) put(key, { ...job, queryError: error instanceof Error ? error.message : '状态查询失败；稍后继续查询原任务' });
    } finally { inFlight.delete(key); settle(); querying.value = inFlight.size > 0; }
  }
  function begin(project: string, script: string) {
    const key = planningKey(project, script);
    if (planningPending(jobs.value[key])) throw new Error(`原${options.label}任务尚未结束，请查询进度`);
    const job: PlanningJob = { projectId: project, scriptId: script, requestId: crypto.randomUUID(), state: 'submitting', startedAt: Date.now(), message: `正在提交${options.label}任务`, queryError: '', lastCheckedAt: 0 };
    put(key, job); return job;
  }
  function consume(job: PlanningJob, event: string, data: Record<string, any>) {
    const key = planningKey(job.projectId, job.scriptId), currentJob = jobs.value[key];
    if (!currentJob || currentJob.requestId !== job.requestId || !planningPending(currentJob)) return;
    if (data.requestId && data.requestId !== job.requestId) return;
    if (event === 'submission' || event === 'complete') { accept(job.projectId, job.scriptId, data as PlanningReceipt); return; }
    if (event === 'progress') { put(key, { ...currentJob, progress: data as PlanningJob['progress'], state: 'running', queryError: '' }); return; }
    if (event === 'error') { void query(job.projectId, job.scriptId); return; }
    if (event === 'phase') put(key, { ...currentJob, message: data.message || currentJob.message });
    if (event === 'panel' && data.panel && (!currentJob.progress || currentJob.progress.cards.every(card => card.key.startsWith('legacy:')))) {
      const number = Number(data.panel.panel_number || data.panel.panelNumber || data.panel.sceneNo);
      const progress = currentJob.progress || { requestId: job.requestId, phase: 'storyboard_detail', message: '规划已返回，正在细化', startedAt: job.startedAt, updatedAt: Date.now(), calls: [], cards: [] };
      put(key, { ...currentJob, progress: { ...progress, cards: upsertPlanningCard(progress.cards, { key: `legacy:${number}`, scene: 1, ordinal: number, stage: 'planned', panel: data.panel }) } });
    }
  }
  function disconnected(job: PlanningJob) {
    const key = planningKey(job.projectId, job.scriptId), currentJob = jobs.value[key];
    if (currentJob?.requestId === job.requestId && planningPending(currentJob)) put(key, { ...currentJob, state: 'submission_unknown', queryError: '连接已断开，正在查询原任务；已返回内容保留' });
    return query(job.projectId, job.scriptId);
  }
  function failedBeforeSubmission(job: PlanningJob, message: string) {
    const key = planningKey(job.projectId, job.scriptId), currentJob = jobs.value[key];
    if (currentJob?.requestId === job.requestId) put(key, { ...currentJob, state: 'error', message });
  }
  async function submit(job: PlanningJob, model: string, prepare: () => Promise<void>) {
    const ownerToken = user.token;
    let submitted = false;
    try {
      await prepare();
      if (user.token !== ownerToken) throw new Error('登录账号已改变，请重新确认当前项目');
      submitted = true;
      const modelQuery = model ? `&model=${encodeURIComponent(model)}` : '';
      const response = await authenticatedFetch(import.meta.env.VITE_API_URL + `/short-drama/${job.projectId}/${options.endpoint}/stream?scriptId=${job.scriptId}&requestId=${job.requestId}${modelQuery}`, {
        method: 'POST', headers: { Authorization: `Bearer ${user.token}`, ClientID: import.meta.env.VITE_CLIENT_ID },
      });
      await readDramaEventStream(response, (event, data) => consume(job, event, data));
      await query(job.projectId, job.scriptId);
    } catch (error) {
      if (error instanceof ShortDramaResponseError || !submitted) {
        failedBeforeSubmission(job, error instanceof Error ? error.message : `${options.label}提交失败`);
        throw error;
      }
      await disconnected(job);
    }
  }
  const clockTimer = setInterval(() => { now.value = Date.now(); }, 1000);
  const pollTimer = setInterval(() => { for (const job of Object.values(jobs.value)) if (planningPending(job)) void query(job.projectId, job.scriptId); }, 5000);
  watch(currentKey, () => { void query(); }, { immediate: true });
  onScopeDispose(() => { disposed = true; clearInterval(clockTimer); clearInterval(pollTimer); });
  return { current, busy, now, querying, begin, consume, query, disconnected, failedBeforeSubmission, submit };
}
