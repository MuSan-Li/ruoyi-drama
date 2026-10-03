import { ElMessage } from 'element-plus';
import i18n from '@/locales';
import router from '@/routers';
import { useUserStore } from '@/stores';
import { beginLoginRequired } from './loginRequiredState';

export async function handleLoginRequired() {
  if (!beginLoginRequired()) return;
  const redirect = router.currentRoute.value.fullPath;
  useUserStore().logout();
  ElMessage.warning({ message: i18n.global.t('common.loginRequired'), grouping: true });
  if (router.currentRoute.value.name !== 'login') {
    await router.replace({ name: 'login', query: { redirect } });
  }
}
