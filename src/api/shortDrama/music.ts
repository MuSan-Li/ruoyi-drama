import { get, post } from '@/utils/request';
export type MusicPurpose = 'bgm' | 'theme' | 'ending';
export interface MusicRequest {
  requestId: string; model: string; purpose: MusicPurpose; title: string; prompt: string;
  style: string; duration: number; vocalGender: 'Male' | 'Female'; negativeTags: string;
}
export interface MusicJob {
  id: string; predictionId?: string; request: MusicRequest; status: string; error: string; createdAt: number;
  variants: Array<{ index: number; url: string; soundId: string; duration: number }>;
}
async function unwrap<T>(response: Promise<T | { data: T }>): Promise<T> {
  const value = await response;
  return value && typeof value === 'object' && 'data' in value ? value.data : value as T;
}
export const listMusic = (project: string) => unwrap(get<MusicJob[]>(`/short-drama/${project}/music`).json());
export const pollMusic = (project: string, id: string) => unwrap(get<MusicJob>(`/short-drama/${project}/music/${id}`).json());
export const generateMusic = (project: string, data: MusicRequest) => unwrap(post<MusicJob>(`/short-drama/${project}/music`, data, { timeout: 200000 }).json());
export const writeMusic = (project: string, data: { model: string; purpose: MusicPurpose; direction: string }) => unwrap(post<{ title: string; style: string; prompt: string }>(`/short-drama/${project}/music/write`, data, { timeout: 600000 }).json());
export const useMusic = (project: string, id: string, data: { variant: number; shots: number[]; volume: number; offset: number; enabled: boolean }) => unwrap(post(`/short-drama/${project}/music/${id}/use`, data).json());
