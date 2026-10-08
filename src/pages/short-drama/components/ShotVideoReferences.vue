<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import { listVideoReferences, uploadVideoReference, type VideoReference } from '@/api/shortDrama/videoReferences';
import LocalVideoPreview from './LocalVideoPreview.vue';
const props = defineProps<{ projectId: string; continuityJson?: string; model?: string; disabled?: boolean }>();
const emit = defineEmits<{ update: [value: string] }>();
const clips = shallowRef<VideoReference[]>([]), error = shallowRef(''), busy = shallowRef(false);
const settings = computed(() => { try { const c=JSON.parse(props.continuityJson || '{}');return c && typeof c==='object' && !Array.isArray(c) ? c : {}; } catch { return {}; } });
const ids = computed<string[]>(() => Array.isArray(settings.value.video_reference_ids) ? settings.value.video_reference_ids : []);
const supported = computed(() => props.model?.endsWith('/reference-to-video') && (props.model.startsWith('bytedance/seedance-2.0') || props.model.startsWith('bytedance/seedance-2.5/')));
const full = computed(() => props.model?.startsWith('bytedance/seedance-2.5/'));
const selectedSeconds = computed(() => clips.value.filter(c=>ids.value.includes(c.id)).reduce((total,c)=>total+c.duration,0));
let version = 0;
async function refresh() {
  const current=++version;error.value='';
  try { const result=await listVideoReferences(props.projectId);if(current===version)clips.value=result; }
  catch(failure) { if(current===version)error.value=failure instanceof Error?failure.message:'动作参考读取失败'; }
}
watch(()=>props.projectId,()=>{ clips.value=[];void refresh(); },{immediate:true});
function select(id:string) {
  const next=ids.value.includes(id)?ids.value.filter(v=>v!==id):[...ids.value,id];
  const seconds=clips.value.filter(c=>next.includes(c.id)).reduce((total,c)=>total+c.duration,0);
  if(next.length>(full.value?10:3) || seconds>(full.value?30.05:15.05)){error.value='所选视频数量或总时长超过当前模型限制';return;}
  error.value='';emit('update',JSON.stringify({...settings.value,video_reference_ids:next},null,2));
}
async function upload(event:Event) {
  const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;
  input.value='';error.value='';
  if(file.size>30*1024*1024){error.value='请选择小于30MB的MP4或MOV视频';return;}
  const project=props.projectId;busy.value=true;
  try { const clip=await uploadVideoReference(project,file);if(props.projectId!==project)return;clips.value=[...clips.value,clip];select(clip.id); }
  catch(failure){if(props.projectId===project)error.value=failure instanceof Error?failure.message:'动作视频上传失败';}
  finally {busy.value=false;}
}
</script>
<template>
  <details class="motion-references">
    <summary><span>动作参考</span><small>白模 / 实拍</small><b>{{ ids.length ? `${ids.length} 条已选` : '未添加' }}</b></summary>
    <p>上传导演工作台导出的白模或动作片段。生成时仅参考身体动作与节奏，人物、场景由视频导演稿指定。</p>
    <p>{{full?'最多10条，合计30秒':'最多3条，合计15秒'}} · MP4 / MOV、24–60fps、单文件小于30MB。已选 {{selectedSeconds.toFixed(2)}} 秒。</p>
    <p v-if="!supported">请选择支持视频参考的 Seedance 多模态参考模型。</p>
    <div class="motion-tools"><label> {{busy?'正在上传…':'上传动作参考'}}<input type="file" accept="video/mp4,video/quicktime,.mp4,.mov" aria-label="上传动作参考视频" :disabled="disabled||busy||!supported" @change="upload"/></label><el-button size="small" :disabled="busy" @click="refresh">刷新参考列表</el-button></div>
    <div v-for="clip in clips" :key="clip.id" class="motion-clip">
      <div><strong>{{clip.name}}</strong><span>{{clip.duration.toFixed(2)}} 秒 · {{clip.width}}×{{clip.height}}</span></div>
      <LocalVideoPreview :src="`/short-drama/${projectId}/video-references/${clip.id}/content`" :title="clip.name" />
      <el-button size="small" :type="ids.includes(clip.id)?'primary':'default'" :disabled="disabled||busy||!supported" @click="select(clip.id)">{{ids.includes(clip.id)?'移出本镜':'用于本镜'}}</el-button>
    </div>
    <p v-if="error" role="alert" class="motion-error">{{error}}</p>
    <p>选择后保存镜头。上传仅保存参考素材，点击「生成视频」才提交视频生成任务。</p>
  </details>
</template>
<style scoped>
.motion-references{padding:14px 16px;margin:12px 0;border:1px solid var(--drama-border);border-radius:8px;background:#f6f9fe;font-size:12px;color:var(--drama-text-secondary)}summary{cursor:pointer;font-size:13px;color:var(--drama-text-primary)}p{line-height:1.7;margin:9px 0}.motion-tools,.motion-clip{display:flex;gap:10px;align-items:center}.motion-tools label{position:relative;padding:5px 10px;border:1px solid #c5d7ef;border-radius:5px;background:white;color:#3975bc;cursor:pointer}.motion-tools input{position:absolute;inset:0;width:100%;opacity:0;cursor:pointer}.motion-clip{padding:10px 0;border-top:1px solid #e1e9f3;margin-top:8px}.motion-clip>div:first-child{flex:1;min-width:0}.motion-clip strong{display:block;overflow-wrap:anywhere;font-weight:500}.motion-clip span{display:block;font-size:11px;margin-top:4px}.motion-error{color:#c34848}
</style>
<style scoped>
.motion-references { min-width: 0; margin: 0; padding: 11px 13px; border-color: var(--drama-border, #e0e5ed); border-radius: 8px; background: var(--drama-surface-muted, #f7f8fa); }
summary { list-style: none; display: flex; align-items: center; gap: 7px; min-height: 20px; color: var(--drama-text, #253249); font-size: 12px; } summary::-webkit-details-marker { display: none; } summary::before { content: ''; width: 5px; height: 5px; margin-right: 3px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(-45deg); transition: transform .15s; flex-shrink: 0; } details[open] > summary::before { transform: rotate(45deg); } summary small { color: var(--drama-text-tertiary, #8a94a6); font-size: 11px; } summary b { margin-left: auto; color: var(--drama-text-secondary, #657084); font-size: 11px; font-weight: 400; white-space: nowrap; }.motion-tools,.motion-clip { flex-wrap: wrap; }
</style>
