import type { Ref } from 'vue';
import { getStoryboardPlanningStatus } from '@/api/shortDrama';
import { useTextGeneration } from './useTextGeneration';

export function useStoryboardPlanning(project: Ref<string | null>, script: () => string | undefined, onCompleted: (project: string) => Promise<void>) {
  return useTextGeneration(project, script, onCompleted, { label: '分镜生成', endpoint: 'plan-storyboard', status: getStoryboardPlanningStatus });
}
