<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ShortDramaStoryboard } from '@/api/shortDrama/types';
import { storyboardKey } from '@/composables/useStoryboardWorkspace';

const emit = defineEmits<{ select: [id: string] }>();
const expanded = ref(false);
const props = defineProps<{ shots: ShortDramaStoryboard[] }>();
const rows = computed(() => props.shots.map(shot => {
  let continuity: Record<string, string | number> = {};
  try { continuity = JSON.parse(shot.continuityJson || '{}'); } catch { /* shown as missing below */ }
  return { shot, continuity };
}));
const totalSeconds = computed(() => props.shots.reduce((sum, shot) => sum + (shot.durationSeconds || 0), 0));
</script>

<template>
  <section class="continuity-review" aria-label="剧情连贯性审阅">
    <div class="review-header">
      <div><h3>剧情连贯性审阅</h3><p>{{ shots.length }} 个镜头 · 预计 {{ Math.floor(totalSeconds / 60) }} 分 {{ totalSeconds % 60 }} 秒</p></div>
    </div>
    <el-button size="small" @click="expanded = true">查看全片因果表</el-button>
    <el-dialog v-model="expanded" title="逐镜因果与状态" width="92vw">
      <div class="review-table-wrap">
        <table>
          <thead><tr><th>场 / 镜</th><th>原因 → 行动 → 结果</th><th>起止状态与转场</th></tr></thead>
          <tbody><tr v-for="{ shot, continuity: c } in rows" :key="shot.id || shot.sceneNo">
            <td><button class="jump-shot" @click="emit('select', storyboardKey(shot)); expanded = false">{{ c.sequence_role === 'title_prologue' ? '片头' : `场 ${c.scene_number ?? '?'}` }} / 镜 {{ shot.sceneNo }}</button><br>{{ shot.sceneTitle }}<br>{{ shot.durationSeconds }} 秒</td>
            <td><p>因：{{ c.narrative_cause || '—' }}</p><p>行：{{ c.story_action || '—' }}</p><p>果：{{ c.story_result || '—' }}</p></td>
            <td><p>起：{{ c.start_state || '—' }}</p><p>止：{{ c.end_state || '—' }}</p><p>接：{{ c.bridge_out || c.next_hook || '—' }}</p></td>
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
.review-header p { color: var(--el-text-color-secondary); font-size: 13px; margin: 8px 0; line-height: 1.6; }
summary { cursor: pointer; padding: 10px 0; }
.review-table-wrap { max-height: 65vh; overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.6; }
th, td { padding: 12px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--el-border-color); }
th { position: sticky; top: 0; background: var(--el-bg-color); }
td:first-child { min-width: 110px; } td p { margin: 0 0 6px; }
.jump-shot { color: #1d4ed8; cursor: pointer; background: transparent; border: 0; padding: 0; font: inherit; text-decoration: underline; }
</style>
