import { onUnmounted, shallowRef, watch } from 'vue';
import { listMusic, pollMusic, type MusicJob } from '@/api/shortDrama/music';
export function useMusicTasks(project: () => string) {
  const jobs = shallowRef<MusicJob[]>([]), error = shallowRef('');
  let epoch = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const pending = (job: MusicJob) => ['processing', 'saving'].includes(job.status);
  function stop() { if (timer) clearTimeout(timer); timer = undefined; }
  function schedule(token: number) {
    stop();
    if (jobs.value.some(pending)) timer = setTimeout(() => { void poll(token); }, 10000);
  }
  async function poll(token: number) {
    const id = project();
    try {
      // Sequential queries avoid overlapping polls and local audio saves.
      for (const job of jobs.value.filter(pending)) {
        if (token !== epoch) return;
        const updated = await pollMusic(id, job.id);
        if (token !== epoch) return;
        jobs.value = jobs.value.map(item => item.id === updated.id ? updated : item);
      }
      if (token === epoch) error.value = '';
    } catch (e) { if (token === epoch) error.value = e instanceof Error ? e.message : '音乐任务查询失败'; }
    finally { if (token === epoch) schedule(token); }
  }
  async function refresh() {
    const token = ++epoch; stop();
    try { const result = await listMusic(project()); if (token === epoch) { jobs.value = result; error.value = ''; schedule(token); } }
    catch (e) { if (token === epoch) error.value = e instanceof Error ? e.message : '音乐任务加载失败'; }
  }
  watch(project, () => { jobs.value = []; void refresh(); }, { immediate: true });
  onUnmounted(() => { epoch++; stop(); });
  return { jobs, error, refresh };
}
