import { watch } from 'vue';
import { WRITING_MODEL_KEY, resolveWritingModel } from '@/utils/writingModelPreference';
export function useWritingModelPreference(read: () => string, write: (model: string) => void) {
  watch(read, (model) => { if (model) { try { localStorage.setItem(WRITING_MODEL_KEY, model); } catch { /* Private storage may be unavailable. */ } } });
  function restore(available: string[]) {
    let saved = '';
    try { saved = localStorage.getItem(WRITING_MODEL_KEY) || ''; } catch { /* Use an available model. */ }
    write(resolveWritingModel(available, read(), saved));
  }
  return { restore };
}
