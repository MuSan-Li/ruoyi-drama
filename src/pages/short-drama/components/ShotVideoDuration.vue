<script setup lang="ts">
import { computed } from 'vue';
import { videoSecondsIssue, withVideoSeconds } from '@/utils/videoDuration';

const props = defineProps<{ continuityJson?: string; disabled?: boolean }>();
const emit = defineEmits<{ update: [value: string] }>();
const settings = computed<Record<string, unknown>>(() => {
  try {
    const value = JSON.parse(props.continuityJson || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  catch { return {}; }
});
const input = computed(() => settings.value.video_seconds == null ? '' : String(settings.value.video_seconds));
const issue = computed(() => videoSecondsIssue(settings.value));
</script>

<template>
  <el-form-item label="时长 · 可选" :error="issue">
    <el-input :model-value="input" type="number" inputmode="numeric" clearable :disabled="disabled"
      aria-label="视频秒数（可选）" placeholder="模型默认" @update:model-value="emit('update', withVideoSeconds(settings, $event))"><template #suffix>秒</template></el-input>
  </el-form-item>
</template>
