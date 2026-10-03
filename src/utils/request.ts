import type { HookFetchPlugin } from 'hook-fetch';
import { ElMessage } from '@/utils/message';
import hookFetch, { ResponseError } from 'hook-fetch';
import { sseTextDecoderPlugin } from 'hook-fetch/plugins';
import i18n from '@/locales';
import { useUserStore } from '@/stores';
import { handleLoginRequired } from './loginRequired';
import { isLoginRequiredResponse } from './loginRequiredState';
import { requestErrorMessage } from './requestFeedback';

interface BaseResponse {
  code: number | string;
  data: never;
  msg: string;
  rows: never;
}

export const request = hookFetch.create<BaseResponse, 'data' | 'rows'>({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  plugins: [sseTextDecoderPlugin({ json: true, prefix: 'data:' })],
});

function jwtPlugin(): HookFetchPlugin<BaseResponse> {
  return {
    name: 'jwt',
    beforeRequest: async (config) => {
      const userStore = useUserStore();
      config.headers = new Headers(config.headers);
      if (userStore.token) config.headers.set('authorization', `Bearer ${userStore.token}`);
      if (import.meta.env.VITE_CLIENT_ID) config.headers.set('ClientID', import.meta.env.VITE_CLIENT_ID);
      return config;
    },
    afterResponse: async (response) => {
      const code = response.result?.code;
      if (isLoginRequiredResponse(response.response.status, code, response.result?.msg)) {
        await handleLoginRequired();
        throw new Error(i18n.global.t('common.loginRequired'));
      }
      if (code === 200 || code === undefined) return response;
      const message = response.result?.msg || i18n.global.t('common.requestFailed');
      ElMessage.error(message);
      return Promise.reject(new Error(message));
    },
    onError: async (error) => {
      if (isLoginRequiredResponse(error.response?.status ?? error.status)) await handleLoginRequired();
      // hook-fetch 默认将标准化错误作为成功值返回，这里保持 Promise 拒绝语义。
      const message = requestErrorMessage(error, i18n.global.t('common.requestFailed'));
      if (message === error.message) throw error;
      throw new ResponseError({ message, status: error.status, statusText: error.statusText,
        response: error.response, config: error.config, name: error.name });
    },
  };
}

request.use(jwtPlugin());

export const post = request.post;
export const get = request.get;
export const put = request.put;
export const del = request.delete;

export default request;
