<script setup lang="ts">
import { shallowRef,onUnmounted,watch } from 'vue';
import { useUserStore } from '@/stores';
const props=defineProps<{src:string}>();
const url=shallowRef(''),error=shallowRef(''),busy=shallowRef(false);let version=0;
function clear(){if(url.value)URL.revokeObjectURL(url.value);url.value='';}
watch(()=>props.src,()=>{version++;clear();error.value='';});
async function load(){const current=version;busy.value=true;try{const base=String(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');const r=await fetch(base+props.src,{headers:{authorization:`Bearer ${useUserStore().token}`,ClientID:import.meta.env.VITE_CLIENT_ID}});if(!r.ok || !r.headers.get('content-type')?.startsWith('video/'))throw new Error('片段加载失败');const blob=await r.blob();if(current!==version)return;clear();url.value=URL.createObjectURL(blob);}catch(e){error.value=String(e);}finally{busy.value=false;}}
onUnmounted(()=>{version++;clear();});
</script>
<template><div><el-button v-if="!url" :loading="busy" @click="load">预览真实素材视频</el-button><template v-else><video :src="url" controls style="width:100%;max-height:440px" /><a :href="url" download="真实素材片段.mp4">下载视频</a></template><p v-if="error">{{error}}</p></div></template>
