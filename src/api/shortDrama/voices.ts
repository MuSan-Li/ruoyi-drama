import { get, post, put } from '@/utils/request';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { useUserStore } from '@/stores';

export interface VoiceSample { id: string; label: string; model?: string; predictionId?: string; source: string; duration: number; createdAt: number }
export interface VoiceProfile { characterId: string; characterName: string; description: string; sampleText: string; selectedSampleId: string | null; version: number; samples: VoiceSample[] }
export interface VoiceRequest { requestId: string; model: string; description: string; sampleText: string; referenceSampleId: string | null }
export interface VoiceJob { id: string; request: VoiceRequest; predictionId?: string; status: string; error: string; createdAt: number }
export interface VoiceView { profile: VoiceProfile; jobs: VoiceJob[] }
export interface VoiceBinding { characterId: string; characterName: string; sampleId: string; version: number; duration: number; audioIndex: number }
export interface VoicePreview { bindings: VoiceBinding[]; speakerIds: string[]; issues: string[]; direction: string; explicit: boolean; references: Array<{ id: string; name: string; duration: number; sha256: string }> }
const root = (project: string, character: string) => `/short-drama/${project}/characters/${character}/voice`;
async function unwrap<T>(request: Promise<T | { data: T }>): Promise<T> {
  const result = await request;
  return result && typeof result === 'object' && 'data' in result ? result.data : result as T;
}
export const getVoice = (project: string, character: string) => unwrap(get<VoiceView>(root(project, character)).json());
export const saveVoice = (project: string, character: string, data: { description: string; sampleText: string }) => unwrap(put<VoiceProfile>(root(project, character), data).json());
export const generateVoice = (project: string, character: string, data: VoiceRequest) => unwrap(post<VoiceJob>(`${root(project, character)}/generate`, data, { timeout: 200000 }).json());
export const pollVoice = (project: string, character: string, id: string) => unwrap(get<VoiceJob>(`${root(project, character)}/jobs/${id}`).json());
export const selectVoice = (project: string, character: string, sampleId: string | null) => unwrap(post<VoiceProfile>(`${root(project, character)}/select`, { sampleId }).json());
export const previewShotVoices = (project: string, shot: string, model?: string) => unwrap(get<VoicePreview>(`/short-drama/${project}/voices/storyboards/${shot}${model ? `?model=${encodeURIComponent(model.replace(/\/(text|image)-to-video$/, '/reference-to-video'))}` : ''}`).json());
export const saveShotSpeakers = (project: string, shot: string, characterIds: string[] | null) => unwrap(put<{ continuityJson: string }>(`/short-drama/${project}/voices/storyboards/${shot}`, { characterIds }).json());
async function voiceFetch(path: string, init?: RequestInit) {
  const base = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const response = await authenticatedFetch(`${base}${path}`, { ...init, headers: { authorization: `Bearer ${useUserStore().token}`, ClientID: import.meta.env.VITE_CLIENT_ID } });
  if (!response.ok) throw new Error('样音加载或上传失败');
  return response;
}
export async function uploadVoice(project: string, character: string, file: File) {
  const body = new FormData(); body.append('file', file);
  const response = await voiceFetch(`${root(project, character)}/upload`, { method: 'POST', body });
  const data = await response.json(); if (data.code !== 200) throw new Error(data.msg || '上传失败');
  return data.data as VoiceSample;
}
export async function voiceBlob(project: string, character: string, id: string) {
  const response = await voiceFetch(`${root(project, character)}/samples/${id}`);
  if (!response.headers.get('content-type')?.startsWith('audio/')) throw new Error('样音尚不可试听');
  return response.blob();
}
