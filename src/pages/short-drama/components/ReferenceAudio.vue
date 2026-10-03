<script setup lang="ts">
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { ref, shallowRef, watch, onUnmounted } from 'vue';
import { useUserStore } from '@/stores';
const props=defineProps<{projectId:string}>();
interface Sound{id:string;name:string;purpose:string;shots:number[];duration:number;volume:number}
const sounds=ref<Sound[]>([]),purpose=shallowRef('bgm'),numbers=shallowRef('1'),volume=shallowRef(0.10),offset=shallowRef(0),busy=shallowRef(false),error=shallowRef(''),preview=shallowRef('');
const base=String(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');
const headers=()=>({authorization:`Bearer ${useUserStore().token}`,ClientID:import.meta.env.VITE_CLIENT_ID});
async function refresh(){const r=await authenticatedFetch(`${base}/short-drama/${props.projectId}/sounds`,{headers:headers()});const data=await r.json();if(data.code!==200)throw new Error(data.msg);sounds.value=data.data;}
watch(()=>props.projectId,()=>{void refresh().catch(e=>error.value=e.message);},{immediate:true});
async function upload(event:Event){const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;busy.value=true;error.value='';
 try{const shots=numbers.value.split(/[,，\s]+/).filter(Boolean).map(Number);if(!shots.length||shots.some(n=>!Number.isInteger(n)||n<1))throw new Error('请填写镜号');const body=new FormData();body.append('file',file);const query=new URLSearchParams({purpose:purpose.value,shots:shots.join(','),volume:String(purpose.value==='bgm'?volume.value:1),offset:String(purpose.value==='bgm'?offset.value:0)});
 const r=await authenticatedFetch(`${base}/short-drama/${props.projectId}/sounds?${query}`,{method:'POST',headers:headers(),body});const data=await r.json();if(data.code!==200)throw new Error(data.msg||'上传失败');await refresh();}catch(e){error.value=e instanceof Error?e.message:'上传失败';}finally{busy.value=false;input.value='';}}
async function listen(sound:Sound){try{const r=await authenticatedFetch(`${base}/short-drama/${props.projectId}/sounds/${sound.id}`,{headers:headers()});if(!r.ok)throw new Error('试听加载失败');if(preview.value)URL.revokeObjectURL(preview.value);preview.value=URL.createObjectURL(await r.blob());}catch(e){error.value=String(e);}}
onUnmounted(()=>{if(preview.value)URL.revokeObjectURL(preview.value);});
</script>
<template>
 <details class="sound-panel"><summary>参考音频与背景音乐 <span>{{sounds.length}}</span></summary>
  <div class="sound-form"><label>用途<select v-model="purpose" aria-label="音频用途"><option value="bgm">背景音乐（合成时混入）</option><option value="reference">生成参考（发送给视频模型）</option></select></label><label>使用镜号<input v-model="numbers" aria-label="音频使用镜号" placeholder="1,4,5"></label><label v-if="purpose==='bgm'">音量<input v-model.number="volume" type="number" min="0" max="1" step="0.01" aria-label="背景音乐音量"></label><label v-if="purpose==='bgm'">素材起点 / 秒<input v-model.number="offset" type="number" min="0" step="0.1" aria-label="音频素材起点"></label><label class="upload">{{busy?'处理中…':'添加音频'}}<input type="file" accept="audio/*" :disabled="busy" aria-label="添加参考音频或背景音乐" @change="upload"></label></div>
  <div v-for="s in sounds" :key="s.id" class="sound-row"><strong>{{s.name}}</strong><span>{{s.purpose==='bgm'?'已选用音乐':s.purpose==='music_candidate'?'候选音乐（未混入）':'生成参考'}} · {{s.duration.toFixed(1)}} 秒<span v-if="s.shots.length"> · 镜 {{s.shots.join('、')}}</span></span><el-button size="small" @click="listen(s)">试听</el-button></div>
  <audio v-if="preview" :src="preview" controls autoplay /><p v-if="error" role="alert">{{error}}</p>
 </details>
</template>
<style scoped>
.sound-panel{border:1px solid #dbe3ef;border-radius:10px;padding:14px;margin:14px 0;background:#f8fafc}.sound-panel summary{cursor:pointer;font-weight:600}.sound-form{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0;align-items:end}.sound-form label{display:flex;flex-direction:column;gap:6px;font-size:12px}.sound-form input,.sound-form select{max-width:210px}.sound-form input{padding:8px;border:1px solid #ccd6e4;border-radius:6px}.sound-form .upload{padding:10px;background:white;border:1px solid #ccd6e4;border-radius:6px;cursor:pointer}.upload input{display:none}.sound-row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:8px 0}.sound-panel p,.sound-row span{font-size:12px;color:#64748b}audio{width:min(100%,480px)}
</style>
