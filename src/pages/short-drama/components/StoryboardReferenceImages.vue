<script setup lang="ts">
import { computed, onUnmounted, shallowRef, useSlots, watch } from 'vue';
import type { ShortDramaCharacter, ShortDramaLocation, ShortDramaStoryboard } from '@/api/shortDrama/types';
import { readShortDramaResource } from '@/api/shortDrama/resources';
import { selectStoryboardAppearance } from '@/utils/storyboardAppearance';
import GeneratedAssetImage from './GeneratedAssetImage.vue';

interface PropAsset {
  id: string; kind: string; title: string; status: string;
  imageUrl?: string; model?: string; predictionId?: string;
}
interface ReferenceImage {
  key: string; title: string; kind: '角色' | '场景' | '道具';
  url: string; model?: string; predictionId?: string;
}
const props = defineProps<{
  projectId: string;
  shot: ShortDramaStoryboard;
  characters: ShortDramaCharacter[];
  locations: ShortDramaLocation[];
}>();
const slots = useSlots();
const hasMaterialSlot = computed(() => !!slots.material);
const propAssets = shallowRef<PropAsset[]>([]);
const loading = shallowRef(false);
const error = shallowRef('');
let epoch = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

function parse(value: string | undefined): unknown {
  try { return JSON.parse(value || 'null'); } catch { return null; }
}
function imageUrls(value: string | undefined): string[] {
  const urls = parse(value);
  return Array.isArray(urls) ? urls.filter((url): url is string => typeof url === 'string' && !!url) : [];
}
function selectedUrl(urls: string[], index?: number): string | undefined {
  return urls[index != null && index >= 0 && index < urls.length ? index : 0];
}

// Match the same explicit visible_props binding used by keyframe and video generation.
const propNames = computed<string[]>(() => {
  const continuity = parse(props.shot.continuityJson) as { visible_props?: unknown } | null;
  const names = continuity?.visible_props;
  return Array.isArray(names) ? [...new Set(names.filter((name): name is string => typeof name === 'string' && !!name))] : [];
});
const references = computed<ReferenceImage[]>(() => {
  const result: ReferenceImage[] = [];
  const cast = parse(props.shot.charactersJson);
  for (const ref of Array.isArray(cast) ? cast : []) {
    if (!ref || typeof ref.name !== 'string') continue;
    const character = props.characters.find(c => c.name === ref.name);
    if (!character) continue;
    const appearance = selectStoryboardAppearance(character.appearances || [], ref.appearance);
    const url = selectedUrl(imageUrls(appearance?.imageUrls), appearance?.selectedImageIndex)
      || appearance?.referenceImageUrl || character.referenceImageUrl;
    if (url) result.push({ key: `character:${character.id || character.name}`, kind: '角色',
      title: `${character.name} · ${appearance?.changeReason || '初始形象'}`, url });
  }
  const location = props.locations.find(l => l.name === props.shot.locationName);
  if (location) {
    const url = selectedUrl(imageUrls(location.imageUrls), location.selectedImageIndex) || location.referenceImageUrl;
    if (url) result.push({ key: `location:${location.id || location.name}`, kind: '场景', title: location.name, url });
  }
  for (const name of propNames.value) {
    const asset = propAssets.value.find(a => a.kind === 'prop' && a.title === name && a.status === 'done' && a.imageUrl);
    if (asset?.imageUrl) result.push({ key: `prop:${asset.id}`, kind: '道具', title: asset.title,
      url: asset.imageUrl, model: asset.model, predictionId: asset.predictionId });
  }
  return result;
});
const missingProps = computed(() => propNames.value.filter(name => !references.value.some(r => r.kind === '道具' && r.title === name)));

async function refresh(version = epoch) {
  clearTimeout(timer);
  if (!propNames.value.length) { loading.value = false; return; }
  loading.value = true;
  error.value = '';
  try {
    const data = await readShortDramaResource<{ assets?: PropAsset[]; running?: boolean }>(`/short-drama/${props.projectId}/visual-assets`);
    if (version !== epoch) return;
    if (!Array.isArray(data.assets)) throw new Error('道具参考图读取失败');
    propAssets.value = data.assets.filter(a => a.kind === 'prop' && a.status !== 'archived');
    if (data.running) timer = setTimeout(() => { void refresh(version); }, 3000);
  } catch (e) {
    if (version === epoch) error.value = e instanceof Error ? e.message : '道具参考图读取失败';
  } finally {
    if (version === epoch) loading.value = false;
  }
}
watch(() => [props.projectId, JSON.stringify(propNames.value)], () => {
  epoch++;
  clearTimeout(timer);
  propAssets.value = [];
  error.value = '';
  void refresh();
}, { immediate: true });
onUnmounted(() => { epoch++; clearTimeout(timer); });
</script>

<template>
  <section v-if="references.length || propNames.length || hasMaterialSlot" class="storyboard-ref-images" aria-label="本镜参考图">
    <span class="ref-label">参考图：</span>
    <div class="references-body">
      <div class="ref-imgs-row">
        <figure v-for="reference in references" :key="reference.key" class="reference-card" :class="{ 'prop-reference': reference.kind === '道具' }">
          <GeneratedAssetImage :src="reference.url" :title="`${reference.kind}参考 · ${reference.title}`" :model="reference.model" :prediction-id="reference.predictionId" />
          <figcaption class="reference-title" :title="`${reference.kind} · ${reference.title}`">{{ reference.kind }} · {{ reference.title }}</figcaption>
        </figure>
        <figure v-for="name in missingProps" :key="`missing:${name}`" class="reference-card">
          <div class="reference-placeholder">{{ loading ? '读取中' : '暂无图片' }}</div>
          <figcaption class="reference-title">道具 · {{ name }}</figcaption>
        </figure>
      </div>
      <div v-if="hasMaterialSlot" class="reference-material">
        <slot name="material" />
      </div>
    </div>
    <el-button v-if="propNames.length" text size="small" :loading="loading" @click="refresh()">{{ error ? '重新读取' : '刷新参考图' }}</el-button>
  </section>
</template>

<style scoped>
.storyboard-ref-images { display:flex; gap:10px; align-items:flex-start; padding:10px 12px; background:#f8fafc; border:1px dashed #d8dee8; border-radius:6px; }
.ref-label { font-size:12px; font-weight:650; color:#6b7280; white-space:nowrap; line-height:72px; }
.references-body { flex:1; min-width:0; }
.ref-imgs-row { display:flex; gap:10px; flex-wrap:wrap; }
.reference-card { width:112px; margin:0; --asset-image-height:72px; }
.reference-card :deep(.el-image) { border:1px solid #e2e8f0; cursor:zoom-in; }
.prop-reference :deep(.el-image) { border-color:#93c5fd; }
.reference-title { margin-top:4px; font-size:11px; color:#64748b; line-height:1.4; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.prop-reference .reference-title { color:#2563eb; font-weight:600; }
.reference-placeholder { display:grid; place-items:center; height:72px; margin-top:10px; border-radius:6px; background:var(--drama-image-surface); color:var(--drama-text-tertiary); font-size:12px; }
.reference-material { margin-top:10px; }
</style>
