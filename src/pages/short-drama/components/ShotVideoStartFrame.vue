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
  <el-form-item label="首帧（可选）">
    <el-checkbox :model-value="enabled" :disabled="disabled" @update:model-value="update">使用已有首帧</el-checkbox>
  </el-form-item>
</template>
