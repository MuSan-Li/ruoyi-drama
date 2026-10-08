<script setup lang="ts">
import { computed, nextTick, shallowRef, useTemplateRef } from 'vue';
import { CopyDocument, FullScreen, EditPen, Reading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { InputInstance } from 'element-plus';
import { formatVideoPromptText } from '@/utils/videoPromptFormatting';
import VideoPromptReader from './VideoPromptReader.vue';

defineProps<{ disabled?: boolean; compact?: boolean }>();
const text = defineModel<string>({ default: '' });
const editing = shallowRef(false);
const expanded = shallowRef(false);
const input = useTemplateRef<InputInstance>('input');
const previousFormat = shallowRef<{ before: string; after: string }>();
const count = computed(() => Array.from(text.value.replace(/\s/gu, '')).length);
const formatted = computed(() => formatVideoPromptText(text.value));
const canUndo = computed(() => previousFormat.value?.after === text.value);

async function edit() {
  editing.value = true;
  await nextTick();
  input.value?.focus();
}
function format() {
  if (formatted.value === text.value) return;
  previousFormat.value = { before: text.value, after: formatted.value };
  text.value = formatted.value;
}
function undoFormat() {
  if (!canUndo.value || !previousFormat.value) return;
  text.value = previousFormat.value.before;
  previousFormat.value = undefined;
}
async function copy() {
  try {
    await navigator.clipboard.writeText(text.value);
    ElMessage.success('提示词已复制');
  } catch { ElMessage.warning('复制未完成，请选中文字后复制'); }
}
</script>

<template>
  <section class="video-prompt-editor" :class="{ 'is-compact': compact }" aria-label="视频提示词">
    <header class="prompt-toolbar">
      <div class="prompt-heading"><strong>视频提示词</strong><span>{{ count.toLocaleString() }} 字</span></div>
      <div class="prompt-tools">
        <div class="prompt-mode" role="group" aria-label="提示词显示方式">
          <button type="button" :aria-pressed="!editing" @click="editing = false"><el-icon><Reading /></el-icon>阅读</button>
          <button type="button" :aria-pressed="editing" :disabled="disabled" @click="edit"><el-icon><EditPen /></el-icon>编辑</button>
        </div>
        <el-button text :icon="CopyDocument" :disabled="!text" aria-label="复制视频提示词" @click="copy" />
        <el-button text :icon="FullScreen" aria-label="展开阅读视频提示词" @click="expanded = true" />
      </div>
    </header>
    <div v-if="editing" class="prompt-edit-area">
      <div class="format-toolbar"><span>保留原文，仅整理段落间距</span><div><el-button v-if="canUndo" text size="small" :disabled="disabled" @click="undoFormat">撤销排版</el-button><el-button size="small" :disabled="disabled || formatted === text" @click="format">分段排版</el-button></div></div>
      <el-input ref="input" v-model="text" type="textarea" :autosize="{ minRows: 12, maxRows: 32 }" :disabled="disabled" aria-label="编辑视频提示词" placeholder="按镜头顺序描述构图、动作与反应，将人物原台词和声音写入对应动作中" />
      <p class="edit-note">编辑后点击“保存镜头”保存。</p>
    </div>
    <VideoPromptReader v-else :text="text" :compact="compact" />
    <el-dialog v-model="expanded" title="视频提示词 · 阅读" width="min(960px, 94vw)" top="5vh" append-to-body class="video-prompt-dialog" destroy-on-close>
      <div class="expanded-prompt"><VideoPromptReader :text="text" /></div>
      <template #footer><el-button :icon="CopyDocument" :disabled="!text" @click="copy">复制提示词</el-button><el-button type="primary" @click="expanded = false">返回镜头</el-button></template>
    </el-dialog>
  </section>
</template>

<style scoped>
.video-prompt-editor { min-width: 0; width: 100%; container: prompt-editor / inline-size; border: 1px solid var(--drama-border, #dfe5ed); border-radius: 10px; overflow: hidden; background: var(--drama-surface, #fff); }
.prompt-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 18px; border-bottom: 1px solid var(--drama-border-subtle, #edf0f4); background: var(--drama-surface-muted, #f7f9fc); }
.prompt-heading { display: flex; align-items: baseline; gap: 10px; }.prompt-heading strong { color: var(--drama-text, #263449); font-size: 14px; font-weight: 650; }.prompt-heading span { font-size: 11px; color: var(--drama-text-tertiary, #8490a3); }
.prompt-tools { display: flex; align-items: center; gap: 8px; }.prompt-tools > .el-button { margin: 0; padding: 7px; height: 30px; color: var(--drama-text-secondary, #657084); }
.prompt-mode { display: flex; padding: 3px; border: 1px solid var(--drama-border, #dfe5ed); border-radius: 7px; background: var(--drama-surface, #fff); }
.prompt-mode button { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border: 0; border-radius: 4px; background: transparent; color: var(--drama-text-secondary, #657084); font: inherit; font-size: 12px; cursor: pointer; }
.prompt-mode button[aria-pressed="true"] { color: var(--drama-primary, #3268e8); background: var(--drama-primary-soft, #eef3ff); }.prompt-mode button:focus-visible { outline: 2px solid var(--drama-primary, #3268e8); outline-offset: 2px; }.prompt-mode button:disabled { opacity: .5; cursor: not-allowed; }
.prompt-edit-area { padding: 16px 20px 10px; }.format-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }.format-toolbar > span, .edit-note { font-size: 11px; line-height: 1.6; color: var(--drama-text-tertiary, #8490a3); }.edit-note { margin: 10px 0 0; }
.video-prompt-editor .prompt-edit-area :deep(.el-textarea__inner) { padding: 18px 20px; font-size: 15px; line-height: 2; border-radius: 7px; }
.expanded-prompt { max-height: 70vh; overflow-y: auto; border: 1px solid var(--drama-border, #dfe5ed); border-radius: 8px; }
.is-compact > .video-prompt-reader { padding: 16px; }
@container prompt-editor (max-width: 430px) { .prompt-toolbar { padding: 12px; }.prompt-tools { margin-left: auto; }.prompt-edit-area { padding: 12px; }.prompt-edit-area :deep(.el-textarea__inner) { padding: 12px; font-size: 14px; } }
</style>
