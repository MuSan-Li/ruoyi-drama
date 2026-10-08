<script setup lang="ts">
import { computed } from 'vue';
import type { GetSessionListVO } from '@/api/model/types';
import { storyboardVideoModel } from '@/utils/storyboardVideoModel';

const props = defineProps<{ continuityJson?: string; models: GetSessionListVO[]; fallback?: string; disabled?: boolean }>();
const emit = defineEmits<{ update: [value: string] }>();
const selected = computed(() => storyboardVideoModel(props.continuityJson, props.fallback));
const choices = computed(() => props.models.filter(model => model.modelName));
function change(value: string) {
  if (!choices.value.some(model => model.modelName === value)) return;
  try {
    const settings = JSON.parse(props.continuityJson || '{}');
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return;
    emit('update', JSON.stringify({ ...settings, video_model: value }, null, 2));
  }
  catch { /* Invalid continuity remains editable and is never overwritten by model selection. */ }
}
</script>

<template>
  <el-form-item label="视频模型">
    <el-select :model-value="selected" :disabled="disabled" aria-label="镜头视频模型" @change="change">
      <el-option v-for="model in choices" :key="model.modelName" :label="model.modelName!" :value="model.modelName!" />
    </el-select>
  </el-form-item>
</template>
