<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ continuityJson?: string; disabled?: boolean }>();
const emit = defineEmits<{ update: [value: string] }>();
const settings = computed(() => {
  try {
    const value = JSON.parse(props.continuityJson || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  catch { return {}; }
});
const resolution = computed(() => settings.value.video_resolution || '720p');
function change(value: string) {
  emit('update', JSON.stringify({ ...settings.value, video_resolution: value }, null, 2));
}
</script>

<template>
  <el-form-item label="输出画质">
    <el-select :model-value="resolution" :disabled="disabled" aria-label="镜头输出画质" @change="change">
      <el-option label="720p" value="720p" />
      <el-option label="1080p 原生" value="1080p" />
      <el-option label="1080p SR 超分辨率" value="1080p-sr" />
      <el-option label="1080p ESR 增强" value="1080p-esr" />
    </el-select>
  </el-form-item>
</template>
