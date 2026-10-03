/** Keep business failures specific and replace transport boilerplate with the caller's action context. */
export function requestErrorMessage(failure: unknown, fallback: string): string {
  const record = failure && typeof failure === 'object' ? failure as { message?: unknown; status?: unknown; httpStatus?: unknown; response?: { status?: unknown } } : undefined;
  const message = typeof failure === 'string' ? failure.trim() : typeof record?.message === 'string' ? record.message.trim() : '';
  const generic = /^(?:(?:Error|TypeError):\s*)?(?:Fail Request(?::.*)?|Failed to fetch|fetch failed|Load failed|Request failed|NetworkError(?::.*)?)$/i;
  if (message && !generic.test(message)) return message;
  const status = Number(record?.httpStatus || record?.response?.status || record?.status);
  return Number.isInteger(status) && status >= 400 ? `${fallback}（HTTP ${status}）` : fallback;
}
