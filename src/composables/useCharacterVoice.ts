import { computed, onUnmounted, ref, shallowRef, watch, type Ref } from 'vue';
import { getModelList } from '@/api/model';
import { generateVoice, getVoice, pollVoice, saveVoice, selectVoice, uploadVoice, voiceBlob, type VoiceView } from '@/api/shortDrama/voices';

let audioModels: ReturnType<typeof getModelList> | undefined;
export function useCharacterVoice(project: Ref<string>, character: Ref<string>) {
  const view = ref<VoiceView>();
  const description = shallowRef(''), sampleText = shallowRef(''), model = shallowRef('');
  const models = ref<Array<{ name: string; label: string }>>([]);
  const busy = shallowRef(false), error = shallowRef(''), preview = shallowRef('');
  const pending = computed(() => view.value?.jobs.some(j => ['submitting', 'processing', 'saving', 'submission_unknown'].includes(j.status)) || false);
  let epoch = 0, timer: ReturnType<typeof setTimeout> | undefined;
  const clearPreview = () => { if (preview.value) URL.revokeObjectURL(preview.value); preview.value = ''; };
  const message = (e: unknown) => e instanceof Error ? e.message : String(e);
  function schedule(token: number) {
    clearTimeout(timer);
    if (token !== epoch || !view.value?.jobs.some(j => ['submitting', 'processing', 'saving'].includes(j.status))) return;
    timer = setTimeout(async () => {
      try {
        const active = view.value?.jobs.filter(j => ['processing', 'saving'].includes(j.status)) || [];
        await Promise.all(active.map(j => pollVoice(project.value, character.value, j.id)));
        await refresh(false, token);
      } catch (e) { if (token === epoch) { error.value = message(e); schedule(token); } }
    }, 5000);
  }
  async function refresh(reset = false, token = epoch) {
    if (token !== epoch) return;
    const result = await getVoice(project.value, character.value);
    if (token !== epoch) return;
    view.value = result;
    if (reset) { description.value = result.profile.description; sampleText.value = result.profile.sampleText; }
    schedule(token);
  }
  async function run(action: () => Promise<unknown>) {
    const token = epoch; busy.value = true; error.value = '';
    try { await action(); await refresh(false, token); }
    catch (e) { if (token === epoch) { error.value = message(e); await refresh(false, token).catch(() => {}); } }
    finally { if (token === epoch) busy.value = false; }
  }
  watch([project, character], async () => {
    const token = ++epoch; clearTimeout(timer); clearPreview(); view.value = undefined; busy.value = false; error.value = '';
    if (!project.value || !character.value) return;
    try {
      await refresh(true, token);
      audioModels ??= getModelList({ category: 'audio' });
      const response = await audioModels;
      if (token !== epoch) return;
      const list = Array.isArray(response) ? response : (response as { data?: unknown }).data;
      models.value = (Array.isArray(list) ? list : []).filter(m => m.modelName === 'bytedance/seed-audio-1.0' && m.providerCode === 'atlas').map(m => ({ name: m.modelName, label: m.modelDescribe || m.modelName }));
      model.value = models.value[0]?.name || '';
    } catch (e) { if (token === epoch) error.value = message(e); audioModels = undefined; }
  }, { immediate: true });
  const save = () => run(() => saveVoice(project.value, character.value, { description: description.value, sampleText: sampleText.value }));
  function generate() {
    const projectId = project.value, characterId = character.value, token = epoch;
    const request = { requestId: crypto.randomUUID(), model: model.value, description: description.value, sampleText: sampleText.value, referenceSampleId: view.value?.profile.selectedSampleId || null };
    return run(async () => {
      await saveVoice(projectId, characterId, { description: request.description, sampleText: request.sampleText });
      if (token !== epoch) return;
      await generateVoice(projectId, characterId, request);
    });
  }
  const select = (id: string | null) => run(() => selectVoice(project.value, character.value, id));
  const upload = (file: File) => run(() => uploadVoice(project.value, character.value, file));
  async function listen(id: string) {
    const token = epoch;
    try { const blob = await voiceBlob(project.value, character.value, id); if (token !== epoch) return; clearPreview(); preview.value = URL.createObjectURL(blob); }
    catch (e) { if (token === epoch) error.value = message(e); }
  }
  onUnmounted(() => { ++epoch; clearTimeout(timer); clearPreview(); });
  return { view, description, sampleText, model, models, busy, error, preview, pending, save, generate, select, upload, listen, refresh };
}
