import type { Ref } from 'vue';
import { getAssetAnalysisStatus } from '@/api/shortDrama';
import { useTextGeneration } from './useTextGeneration';

export function useAssetAnalysis(project: Ref<string | null>, script: () => string | undefined, onCompleted: (project: string) => Promise<void>) {
  return useTextGeneration(project, script, onCompleted, { label: '资产分析', endpoint: 'analyze-assets', status: getAssetAnalysisStatus });
}
