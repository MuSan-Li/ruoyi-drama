<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ continuityJson?: string; disabled?: boolean }>();
const emit = defineEmits<{ update: [value: string] }>();
const settings = computed<Record<string, unknown>>(() => {
  try {
    const value = JSON.parse(props.continuityJson || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  catch { return {}; }
});
const enabled = computed(() => settings.value.video_use_start_frame !== false);
function update(value: boolean | string | number) {
  emit('update', JSON.stringify({ ...settings.value, video_use_start_frame: value === true }));
}
</script>

<template>
  <div class="start-frame-setting">
    <el-switch :model-value="enabled" :disabled="disabled" size="small" aria-label="使用已有首帧" @update:model-value="update" />
    <span>使用已有首帧</span><small>可选参考</small>
  </div>
</template>

<style scoped>
.start-frame-setting { display: flex; align-items: center; gap: 9px; padding-top: 12px; min-height: 28px; }.start-frame-setting span { font-size: 12px; color: var(--drama-text-secondary, #657084); }.start-frame-setting small { margin-left: auto; font-size: 11px; color: var(--drama-text-tertiary, #8a94a6); }
</style>
