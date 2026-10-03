let pending = false;

export const isLoginRequiredPending = () => pending;
export const resetLoginRequired = () => { pending = false; };
export function beginLoginRequired() {
  if (pending) return false;
  pending = true;
  return true;
}

export function isLoginRequiredResponse(status?: number, code?: number | string, message?: string) {
  return status === 401 || code === 401 || code === '401' || code === 'NOT_LOGIN'
    || /\bNOT_LOGIN\b/.test(message || '');
}
