export const SEEDREAM_IMAGE_MODEL = 'bytedance/seedream-v4.7/text-to-image';
export const IMAGE_MODEL_KEY = 'ruoyi-drama:image-model';
export const IMAGE_MODEL_POLICY = 'seedream-v4.7-t2i-v1';

interface ImageModelPreference {
  policy: string;
  modelName: string;
}

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): PreferenceStorage | undefined {
  try { return globalThis.localStorage; } catch { return undefined; }
}

function isCurrentPreference(value: unknown): value is ImageModelPreference {
  return typeof value === 'object' && value !== null
    && 'policy' in value && value.policy === IMAGE_MODEL_POLICY
    && 'modelName' in value && typeof value.modelName === 'string';
}

/** Migrate old defaults once; later explicit choices survive without silent fallback. */
export function resolveImageModel(available: string[], saved: unknown = null): string {
  if (isCurrentPreference(saved)) {
    return available.includes(saved.modelName) ? saved.modelName : '';
  }
  return available.includes(SEEDREAM_IMAGE_MODEL) ? SEEDREAM_IMAGE_MODEL : '';
}

export function saveImageModelPreference(modelName: string, storage = browserStorage()): void {
  if (!modelName) return;
  try {
    storage?.setItem(IMAGE_MODEL_KEY, JSON.stringify({ policy: IMAGE_MODEL_POLICY, modelName }));
  } catch { /* The visible choice still works when browser storage is unavailable. */ }
}

export function restoreImageModelPreference(available: string[], storage = browserStorage()): string {
  let saved: unknown = null;
  try {
    saved = JSON.parse(storage?.getItem(IMAGE_MODEL_KEY) || 'null');
  } catch { /* Malformed or unavailable storage uses the configured preferred model. */ }
  const modelName = resolveImageModel(available, saved);
  if (modelName) saveImageModelPreference(modelName, storage);
  return modelName;
}
