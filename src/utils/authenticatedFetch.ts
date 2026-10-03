import { handleLoginRequired } from './loginRequired';
import { isLoginRequiredResponse } from './loginRequiredState';
import { ShortDramaResponseError } from './shortDramaResponse';

/** 与普通 API 共用登录恢复，覆盖事件流、上传和受保护媒体下载。 */
export async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  let payload: { code?: number | string; msg?: string } | undefined;
  if (response.headers.get('content-type')?.includes('application/json')) {
    try { payload = await response.clone().json(); }
    catch { /* 后续业务解析负责报告无效 JSON。 */ }
  }
  if (isLoginRequiredResponse(response.status, payload?.code, payload?.msg)) {
    await handleLoginRequired();
    throw new ShortDramaResponseError('请先登录', response, payload);
  }
  return response;
}
