<script setup lang="ts">
import { computed, ref } from 'vue';
import { reviewShot } from '../shotReview';
import type { ShortDramaStoryboard } from '@/api/shortDrama/types';

const emit = defineEmits<{ select: [sceneNo: number] }>();
const expanded = ref(false);
const issues = computed(() => props.shots.filter(s => reviewShot(s).issues.length));
const overflows = computed(() => props.shots.filter(s => reviewShot(s).overflow));
const props = defineProps<{ shots: ShortDramaStoryboard[] }>();
const rows = computed(() => props.shots.map(shot => {
  let continuity: Record<string, string | number> = {};
  try { continuity = JSON.parse(shot.continuityJson || '{}'); } catch { /* shown as missing below */ }
  return { shot, continuity };
}));
const totalSeconds = computed(() => props.shots.reduce((sum, shot) => sum + (shot.durationSeconds || 0), 0));
const incomplete = computed(() => rows.value.filter(({ shot, continuity }) =>
  !shot.sourceText || !continuity.narrative_cause || !continuity.story_result || !continuity.start_state || !continuity.end_state));
</script>

<template>
  <section class="continuity-review" aria-label="剧情连贯性审阅">
    <div class="review-header">
      <div><h3>剧情连贯性审阅</h3><p>{{ shots.length }} 个镜头 · 预计 {{ Math.floor(totalSeconds / 60) }} 分 {{ totalSeconds % 60 }} 秒</p></div>
      <el-tag v-if="incomplete.length" type="warning">{{ incomplete.length }} 镜缺少承接信息</el-tag>
    </div>
    <p v-if="overflows.length || issues.length" class="review-hint">内容超时 {{ overflows.length }} 镜 · 待检查 {{ issues.length }} 镜</p>
    <el-button size="small" @click="expanded = true">查看全片因果表</el-button>
    <el-dialog v-model="expanded" title="逐镜因果与状态" width="92vw">
      <div class="review-table-wrap">
        <table>
          <thead><tr><th>场 / 镜</th><th>原因 → 行动 → 结果</th><th>起止状态与转场</th></tr></thead>
          <tbody><tr v-for="{ shot, continuity: c } in rows" :key="shot.id || shot.sceneNo">
            <td><button class="jump-shot" @click="emit('select', shot.sceneNo); expanded = false">场 {{ c.scene_number || '?' }} / 镜 {{ shot.sceneNo }}</button><br>{{ shot.sceneTitle }}<br>{{ shot.durationSeconds }} 秒</td>
            <td><p>因：{{ c.narrative_cause || '待补充' }}</p><p>行：{{ c.story_action || '待补充' }}</p><p>果：{{ c.story_result || '待补充' }}</p></td>
            <td><p>起：{{ c.start_state || '待补充' }}</p><p>止：{{ c.end_state || '待补充' }}</p><p>接：{{ c.bridge_out || c.next_hook || '待补充' }}</p></td>
          </tr></tbody>
        </table>
      </div>
    </el-dialog>
  </section>
</template>

<style scoped>
.continuity-review { padding: 14px; margin: 0; border: 1px solid var(--el-border-color); border-radius: 12px; background: var(--el-fill-color-light); }
.review-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.review-header h3 { font-size: 18px; margin: 0 0 8px; }
.review-hint, .review-header p { color: var(--el-text-color-secondary); font-size: 13px; margin: 8px 0; line-height: 1.6; }
summary { cursor: pointer; padding: 10px 0; }
.review-table-wrap { max-height: 65vh; overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.6; }
th, td { padding: 12px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--el-border-color); }
th { position: sticky; top: 0; background: var(--el-bg-color); }
td:first-child { min-width: 110px; } td p { margin: 0 0 6px; }
.jump-shot { color: #1d4ed8; cursor: pointer; background: transparent; border: 0; padding: 0; font: inherit; text-decoration: underline; }
</style>
