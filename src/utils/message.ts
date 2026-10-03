import { ElMessage as elementMessage } from 'element-plus';
import { isLoginRequiredPending } from './loginRequiredState';

// 请求层已处理登录失效时，页面 catch 不再重复展示失败提示。
// 保持 Element Plus 的调用方式和返回类型，正常业务提示仍交由原组件处理。
const silentMessage = { close() {} };
export const ElMessage: typeof elementMessage = new Proxy(elementMessage, {
  apply(target, thisArg, args) {
    if (isLoginRequiredPending()) return silentMessage;
    return Reflect.apply(target, thisArg, args);
  },
  get(target, key, receiver) {
    const value = Reflect.get(target, key, receiver);
    if (['error', 'warning', 'info', 'success'].includes(String(key))) {
      return (...args: unknown[]) => isLoginRequiredPending()
        ? silentMessage : Reflect.apply(value, target, args);
    }
    return value;
  },
});
