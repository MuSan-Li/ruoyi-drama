<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { CircleCheckFilled } from '@element-plus/icons-vue';
import { buildAssetPromptDisplay } from '@/utils/assetPromptDisplay';
import GeneratedAssetImage from './GeneratedAssetImage.vue';

const props = withDefaults(defineProps<{
  urls: string[];
  descriptions?: string[];
  fallbackPrompt?: string;
  selectedIndex?: number;
  label: string;
  variant?: 'role' | 'location';
}>(), {
  descriptions: () => [],
  fallbackPrompt: '',
  selectedIndex: -1,
  variant: 'role',
});

const emit = defineEmits<{
  select: [index: number];
  delete: [index: number];
}>();

const previewIndex = shallowRef<number | null>(null);
const promptIndex = shallowRef<number | null>(null);

const previewUrl = computed(() => previewIndex.value == null ? '' : props.urls[previewIndex.value] || '');
const previewAlt = computed(() => previewIndex.value == null ? props.label : `${props.label}-${previewIndex.value + 1}`);
const promptDisplay = computed(() => {
  if (promptIndex.value == null) return buildAssetPromptDisplay('', props.fallbackPrompt);
  return buildAssetPromptDisplay(props.descriptions[promptIndex.value], props.fallbackPrompt);
});
const promptTitle = computed(() => promptIndex.value == null
  ? '生成提示词'
  : `${props.label} · 候选 ${promptIndex.value + 1} 的生成提示词`);

function openPreview(index: number) {
  previewIndex.value = index;
}

function closePreview() {
  previewIndex.value = null;
}

function openPrompt(index: number) {
  promptIndex.value = index;
}
</script>

<template>
  <div class="image-gallery">
    <div
      v-for="(url, index) in urls"
      :key="`${url}-${index}`"
      class="image-gallery-item"
      :class="[{ selected: index === selectedIndex }, variant === 'location' ? 'loc-img' : 'role-img']"
    >
      <button
        type="button"
        class="gallery-preview-trigger"
        :aria-label="`放大查看${label}候选 ${index + 1}`"
        @click="openPreview(index)"
      >
        <GeneratedAssetImage
          :src="url"
          :title="`${label}-${index + 1}`"
          :interactive="false"
          :fit="variant === 'role' ? 'contain' : 'cover'"
        />
      </button>
      <button type="button" class="gallery-index" :aria-label="`选用候选 ${index + 1}`" @click.stop="emit('select', index)">
        {{ index + 1 }}
      </button>
      <button type="button" class="gallery-prompt" @click.stop="openPrompt(index)">提示词</button>
      <button
        type="button"
        class="gallery-delete"
        :disabled="urls.length <= 1"
        :title="urls.length <= 1 ? '至少保留一张图片' : '删除图片'"
        :aria-label="`删除候选 ${index + 1}`"
        @click.stop="emit('delete', index)"
      >×</button>
      <el-icon v-if="index === selectedIndex" class="gallery-check"><CircleCheckFilled /></el-icon>
    </div>
  </div>

  <el-dialog
    :model-value="previewIndex != null"
    :title="previewAlt"
    width="min(1120px, calc(100vw - 32px))"
    append-to-body
    destroy-on-close
    class="asset-image-preview-dialog"
    @update:model-value="(value: boolean) => { if (!value) closePreview(); }"
  >
    <button type="button" class="asset-image-preview" title="点击大图关闭" @click="closePreview">
      <GeneratedAssetImage v-if="previewUrl" :src="previewUrl" :title="previewAlt" :interactive="false" />
    </button>
  </el-dialog>

  <el-dialog
    :model-value="promptIndex != null"
    :title="promptTitle"
    width="min(760px, calc(100vw - 32px))"
    append-to-body
    destroy-on-close
    class="asset-prompt-dialog"
    @update:model-value="(value: boolean) => { if (!value) promptIndex = null; }"
  >
    <pre class="prompt-summary">{{ promptDisplay.summary }}</pre>
    <details v-if="promptDisplay.condensed" class="prompt-full-record">
      <summary>查看完整生成记录（{{ promptDisplay.full.length }} 字）</summary>
      <pre>{{ promptDisplay.full }}</pre>
    </details>
  </el-dialog>
</template>

<style scoped lang="scss">
.image-gallery { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
.image-gallery-item {
  position: relative;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border: 2px solid #e8ecf1;
  border-radius: 8px;
  background: #eef2f6;
  transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}
.image-gallery-item:hover { border-color: #a8b5c8; transform: translateY(-1px); box-shadow: 0 4px 12px rgb(0 0 0 / 8%); }
.image-gallery-item.selected { border-color: var(--drama-primary); box-shadow: 0 0 0 2px var(--drama-focus); }
.image-gallery-item.role-img { aspect-ratio: 3 / 4; background: var(--drama-image-surface); }
.image-gallery-item.role-img img { object-fit: contain; }
.image-gallery-item.loc-img { aspect-ratio: 16 / 9; }
.gallery-preview-trigger {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
}
.gallery-preview-trigger { --asset-image-height:100%; --asset-image-radius:0; }
.gallery-preview-trigger :deep(.generated-image) { height:100%; }
.gallery-index,
.gallery-prompt,
.gallery-delete {
  position: absolute;
  z-index: 3;
  border: 0;
  color: #fff;
  background: rgb(15 23 42 / 72%);
  backdrop-filter: blur(4px);
  cursor: pointer;
}
.gallery-index { top: 4px; left: 5px; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 700; line-height: 1.4; }
.gallery-prompt { bottom: 5px; left: 5px; padding: 3px 8px; border-radius: 5px; font-size: 11px; }
.gallery-index:hover,
.gallery-prompt:hover { background: var(--drama-primary); }
.gallery-delete {
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 50%;
  font-size: 18px;
  line-height: 22px;
  transition: background .15s, opacity .15s;
}
.gallery-delete:hover:not(:disabled) { background: #dc2626; }
.gallery-delete:disabled { cursor: not-allowed; opacity: .35; }
.gallery-check { position: absolute; right: 5px; bottom: 5px; color: #22c55e; font-size: 17px; filter: drop-shadow(0 1px 2px rgb(0 0 0 / 40%)); }
.asset-image-preview {
  --asset-image-height: min(68vh, 760px);
  --asset-image-radius: 0;
  display: grid;
  width: 100%;
  max-height: calc(100vh - 210px);
  padding: 0;
  overflow: auto;
  place-items: center;
  border: 0;
  background: #0b1018;
  cursor: zoom-out;
}
.asset-image-preview img { display: block; max-width: 100%; max-height: calc(100vh - 210px); object-fit: contain; }
.prompt-condensed-note { margin: 0 0 10px; color: #52647b; font-size: 13px; }
.prompt-summary,
.prompt-full-record pre {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #263244;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.75;
}
.prompt-summary { max-height: 42vh; padding: 14px; overflow: auto; border: 1px solid #dbe3ee; border-radius: 8px; background: #f8fafc; }
.prompt-full-record { margin-top: 14px; color: #52647b; font-size: 12px; }
.prompt-full-record summary { cursor: pointer; font-weight: 650; }
.prompt-full-record pre { max-height: 42vh; margin-top: 10px; padding: 14px; overflow: auto; border-radius: 8px; background: #111827; color: #e5edf7; }
</style>
