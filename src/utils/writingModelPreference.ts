export const DOUBAO_WRITING_MODEL = 'bytedance/doubao-seed-2.1-pro-260628';
export const WRITING_MODEL_KEY = 'ruoyi-drama:writing-model';
export function resolveWritingModel(available: string[], current = '', saved = ''): string {
  return [current, saved, DOUBAO_WRITING_MODEL].find(name => available.includes(name)) || available[0] || '';
}
