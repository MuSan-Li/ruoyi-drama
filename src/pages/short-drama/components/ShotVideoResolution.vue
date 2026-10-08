<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ continuityJson?: string; model?: string; disabled?: boolean }>();
const emit = defineEmits<{ update: [value: string] }>();
const settings = computed(() => {
  try {
    const value = JSON.parse(props.continuityJson || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  catch { return {}; }
});
const isH3 = computed(() => props.model === 'minimax/h3-developer/image-to-video');
const resolution = computed(() => settings.value.video_resolution || (isH3.value ? '768P' : '720p'));
const choices = computed(() => isH3.value
  ? [{ label: '480P', value: '480P' }, { label: '768P 原生', value: '768P' },
      { label: '1440p SR 超分辨率', value: '1440p-sr' }, { label: '4K SR 超分辨率', value: '4k-sr' }]
  : props.model?.startsWith('bytedance/seedance-2.0-mini/')
  ? [{ label: '480p', value: '480p' }, { label: '720p', value: '720p' },
      { label: '720p SR 超分辨率', value: '720p-sr' }, { label: '1080p SR 超分辨率', value: '1080p-sr' },
      { label: '1440p SR 超分辨率', value: '1440p-sr' }]
  : [{ label: '720p', value: '720p' }, { label: '1080p 原生', value: '1080p' },
      { label: '1080p SR 超分辨率', value: '1080p-sr' }, { label: '1080p ESR 增强', value: '1080p-esr' }]);
function change(value: string) {
  emit('update', JSON.stringify({ ...settings.value, video_resolution: value }, null, 2));
}
</script>

<template>
  <el-form-item label="输出画质">
    <el-select :model-value="resolution" :disabled="disabled" aria-label="镜头输出画质" @change="change">
      <el-option v-for="option in choices" :key="option.value" :label="option.label" :value="option.value" />
    </el-select>
  </el-form-item>
</template>
