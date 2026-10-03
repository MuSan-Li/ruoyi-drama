<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from '@/utils/message';
import { useI18n } from 'vue-i18n';
import { batchUpdateKeyByProvider } from '@/api/model';

const visible = defineModel<boolean>({ default: false });
const { t } = useI18n();
const apiKey = ref('');
const submitting = ref(false);
watch(visible, () => { apiKey.value = ''; });

async function save() {
  const value = apiKey.value.trim();
  if (!value) { ElMessage.warning(t('home.messages.atlasKeyRequired')); return; }
  if (submitting.value) return;
  submitting.value = true;
  try {
    await batchUpdateKeyByProvider('atlas', value);
    ElMessage.success(t('home.messages.atlasKeyUpdated'));
    visible.value = false;
  } catch (error) {
    // Keep a visible failure response even when the transport fails before a business envelope.
    ElMessage.error(error instanceof Error ? error.message : t('common.requestFailed'));
  } finally { submitting.value = false; }
}
</script>

<template>
  <el-dialog v-model="visible" :title="t('home.keyConfig.dialogTitle')" width="min(460px, 94vw)" append-to-body :close-on-click-modal="!submitting" :close-on-press-escape="!submitting" :show-close="!submitting">
    <p class="key-tip">
      {{ t('home.keyConfig.tip') }}
      <a href="https://www.atlascloud.ai?ref=89F97E&utm_source=github&utm_campaign=ruoyi-drama" target="_blank" rel="noopener noreferrer">{{ t('home.keyConfig.getKey') }}</a>
    </p>
    <el-alert type="warning" :closable="false" show-icon :title="t('home.keyConfig.warning')" />
    <el-form label-position="top" @submit.prevent="save">
      <el-form-item :label="t('home.keyConfig.label')">
        <el-input v-model="apiKey" type="password" show-password autocomplete="off" :disabled="submitting" :placeholder="t('home.keyConfig.placeholder')" @keydown.enter.prevent="save" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="submitting" @click="visible = false">{{ t('home.keyConfig.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="save">{{ t('home.keyConfig.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.key-tip { margin: 0 0 14px; font-size: 13px; line-height: 1.7; color: #64748b; }
.key-tip a { color: #2563eb; margin-left: 4px; text-decoration: none; }
.key-tip a:hover { text-decoration: underline; }
.el-form { margin-top: 18px; }
</style>
