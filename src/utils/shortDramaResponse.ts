export interface ShortDramaBusinessResponse {
  code?: number | string;
  msg?: string;
  message?: string;
  data?: unknown;
}

export class ShortDramaResponseError extends Error {
  readonly httpStatus: number;
  readonly contentType: string;
  readonly businessCode?: number | string;
  readonly loginExpired: boolean;

  constructor(message: string, response: Response, payload?: ShortDramaBusinessResponse) {
    super(message);
    this.name = 'ShortDramaResponseError';
    this.httpStatus = response.status;
    this.contentType = response.headers.get('content-type') || '';
    this.businessCode = payload?.code;
    this.loginExpired = [401, 403].includes(response.status)
      || [401, 403, '401', '403', 'NOT_LOGIN'].includes(payload?.code ?? '')
      || /\bNOT_LOGIN\b/.test(message);
  }
}

function businessObject(value: unknown): ShortDramaBusinessResponse | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ShortDramaBusinessResponse : undefined;
}

async function responseBusinessObject(response: Response) {
  try { return businessObject(await response.json()); }
  catch { return undefined; }
}

/** HTTP 200 is also used for business errors; validate the body before opening a reader. */
export async function requireShortDramaEventStream(response: Response) {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (response.ok && contentType.split(';')[0].trim() === 'text/event-stream' && response.body) return;
  const payload = contentType.includes('json') ? await responseBusinessObject(response) : undefined;
  const message = payload?.msg || payload?.message
    || (!response.ok ? `请求返回 HTTP ${response.status}` : `接口未返回事件流（${contentType || '内容类型缺失'}），生成结果尚未确认`);
  throw new ShortDramaResponseError(message, response, payload);
}

export async function requireShortDramaBusinessJson(response: Response) {
  const payload = await responseBusinessObject(response);
  if (!response.ok || !payload || payload.code !== 200) {
    throw new ShortDramaResponseError(payload?.msg || payload?.message || '接口未返回成功业务结果', response, payload);
  }
  return payload;
}

export function requireShortDramaStreamComplete(completed: boolean, projectId?: string | null) {
  if (!completed || projectId !== undefined && !projectId) {
    throw new Error('生成连接已结束，但未收到完整完成确认；请先查看项目或失败记录，不会自动重新提交');
  }
}
