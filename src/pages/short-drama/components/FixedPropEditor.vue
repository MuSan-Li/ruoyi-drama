<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import { uploadReferenceImage } from '@/api/shortDrama';
import { post } from '@/utils/request';
const props=defineProps<{projectId:string;imageModel:string}>();
const emit=defineEmits<{saved:[]}>();
const show=shallowRef(false), busy=shallowRef(false), error=shallowRef('');
const form=ref({title:'',prompt:'',numbers:'',imageUrl:''});
async function upload(event:Event){const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;busy.value=true;try{form.value.imageUrl=await uploadReferenceImage(file,props.imageModel);}catch(e){error.value=String(e);}finally{busy.value=false;input.value='';}}
async function save(){
  const shotNumbers=form.value.numbers.split(/[,，\s]+/).filter(Boolean).map(Number);
  if(!shotNumbers.length || shotNumbers.some(n=>!Number.isInteger(n)||n<1)){error.value='请填写有效镜号，以逗号分隔';return;}
  busy.value=true;error.value='';
  try{const r:any=await post(`/short-drama/${props.projectId}/visual-assets/prop`,{title:form.value.title,prompt:form.value.prompt,shotNumbers,imageUrl:form.value.imageUrl}).json();if(r.code!==200)throw new Error(r.msg||'保存失败');show.value=false;emit('saved');}
  catch(e){error.value=e instanceof Error?e.message:'保存失败';}finally{busy.value=false;}
}
</script>
<template>
  <el-button @click="form={title:'',prompt:'',numbers:'',imageUrl:''};show=true">维护固定道具</el-button>
  <el-dialog v-model="show" title="固定道具" width="min(640px,94vw)">
    <el-form label-position="top">
      <el-form-item label="道具名称（同名更新）"><el-input v-model="form.title" aria-label="道具名称" /></el-form-item>
      <el-form-item label="固定外观"><el-input v-model="form.prompt" type="textarea" :rows="6" aria-label="固定道具描述" /></el-form-item>
      <el-form-item label="出现镜号"><el-input v-model="form.numbers" placeholder="例如 1,2,3,5" aria-label="道具出现镜号" /></el-form-item>
    <el-form-item label="指定参考图（可选，原图直接作为固定资产）"><input type="file" accept="image/png,image/jpeg" aria-label="固定道具参考图" @change="upload"><span v-if="form.imageUrl">已上传</span></el-form-item></el-form><p v-if="error" role="alert">{{error}}</p>
    <template #footer><el-button type="primary" :loading="busy" @click="save">保存道具</el-button></template>
  </el-dialog>
</template>
