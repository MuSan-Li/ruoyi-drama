import type { GetSessionListVO } from './types';
import { get, put } from '@/utils/request';

export function getModelList(params?: { category?: string; providerCode?: string }) {
  const search = new URLSearchParams();
  if (params?.category) search.set('category', params.category);
  if (params?.providerCode) search.set('providerCode', params.providerCode);
  const query = search.size ? `?${search}` : '';
  return get<GetSessionListVO[]>(`/system/model/modelList${query}`).json();
}

/**
 * 按厂商批量更新密钥
 */
export function batchUpdateKeyByProvider(providerCode: string, apiKey: string) {
  return put<void>('/system/model/batchKeyByProvider', { providerCode, apiKey }).json();
}

