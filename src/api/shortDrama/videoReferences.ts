import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { useUserStore } from '@/stores';
import { readShortDramaResource } from './resources';
export interface VideoReference { id: string; name: string; duration: number; width: number; height: number; fps: number; bytes: number; sha256: string }
export const listVideoReferences = (project: string) => readShortDramaResource<VideoReference[]>(`/short-drama/${project}/video-references`);
export async function uploadVideoReference(project: string, file: File): Promise<VideoReference> {
  const form = new FormData(); form.append('file', file);
  const base = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const response = await authenticatedFetch(`${base}/short-drama/${project}/video-references`, {
    method: 'POST', headers: { authorization: `Bearer ${useUserStore().token}`, ClientID: import.meta.env.VITE_CLIENT_ID }, body: form,
  });
  const payload = await response.json() as { code: number; msg?: string; data: VideoReference };
  if (!response.ok || payload.code !== 200 || !payload.data?.id) throw new Error(payload.msg || '动作视频上传失败');
  return payload.data;
}
