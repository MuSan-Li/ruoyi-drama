<script setup lang="ts">
import { computed } from 'vue';
import type { ShortDramaStoryboard } from '@/api/shortDrama/types';
import { reviewShot, type TimingPlan } from '../shotReview';
const props = defineProps<{ shot: ShortDramaStoryboard }>();
const emit = defineEmits<{ update: [value: string] }>();
const review = computed(() => reviewShot(props.shot));
function update(key: keyof TimingPlan, value: string | number | undefined) {
  const c = review.value.c;
  emit('update', JSON.stringify({ ...c, timing: { spoken_text: review.value.spoken, speech_rate: 4, action_seconds: 0, pause_seconds: 2, ...c.timing, [key]: value } }));
}
</script>
<template>
  <section class="timing" aria-label="镜头时间预算" :class="{ overflow: review.overflow }">
    <div class="timing-head"><strong>时间预算</strong><span>分配 {{ review.duration }} 秒 / 内容估算 {{ review.required }} 秒</span></div>
    <p>对白 {{ review.speech }} 秒 + 独占动作 {{ review.action }} 秒 + 停顿 {{ review.pauses }} 秒</p>
    <p v-if="review.overflow" class="timing-warning">估算与当前安排有差异，可结合实际表演调整，不影响保存或生成。</p>
    <p v-if="review.plan.action_note">动作安排：{{ review.plan.action_note }}</p>
    <details><summary>调整时间预算</summary>
      <label>实际说出的台词（数字按读音展开）<el-input :model-value="review.spoken" type="textarea" :rows="3" aria-label="实际说出台词" @update:model-value="update('spoken_text', $event)" /></label>
      <div class="timing-inputs">
        <label>语速（字/秒）<el-input-number :model-value="review.plan.speech_rate || 4" :min="2" :max="5" :step="0.2" aria-label="对白语速" @update:model-value="update('speech_rate', $event)" /></label>
        <label>独占动作（秒）<el-input-number :model-value="review.action" :min="0" :max="60" :step="0.5" aria-label="独占动作秒数" @update:model-value="update('action_seconds', $event)" /></label>
        <label>停顿（秒）<el-input-number :model-value="review.pauses" :min="0" :max="60" :step="0.5" aria-label="停顿秒数" @update:model-value="update('pause_seconds', $event)" /></label>
        <label>实测对白音轨（秒，0 表示未测）<el-input-number :model-value="review.plan.measured_audio_seconds || 0" :min="0" :max="60" :step="0.1" aria-label="实测对白音轨秒数" @update:model-value="update('measured_audio_seconds', $event)" /></label>
      </div>
    </details>
  </section>
</template>
<style scoped>
.timing { padding: 14px; background: #eef6ff; border: 1px solid #c9ddfa; border-radius: 8px; font-size: 13px; line-height: 1.6; color: #263b54; }
.timing.overflow { background: #fff4ee; border-color: #efb49a; }
.timing-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; }
.timing p { margin: 6px 0; }.timing-warning { color: #ad3d17; font-weight: 600; }
.timing summary { cursor: pointer; margin: 8px 0; }.timing label { display: grid; gap: 6px; }
.timing-inputs { display: flex; flex-wrap: wrap; gap: 16px; margin: 10px 0; }.timing small { display: block; color: #536578; }
</style>
