import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { requireShortDramaBusinessJson } from '@/utils/shortDramaResponse';
import { useUserStore } from '@/stores';

/** Optional view reads report failures in their own controls, without unrelated global toasts. */
export async function readShortDramaResource<T>(path: string): Promise<T> {
  const base = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const response = await authenticatedFetch(`${base}${path}`, {
    headers: { authorization: `Bearer ${useUserStore().token}`, ClientID: import.meta.env.VITE_CLIENT_ID },
  });
  return (await requireShortDramaBusinessJson(response)).data as T;
}
