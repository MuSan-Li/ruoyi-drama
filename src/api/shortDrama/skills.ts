import { get } from '@/utils/request';
import { readShortDramaResource } from './resources';
import type { ShortDramaSkill, ShortDramaSkillDetail, ShortDramaSkillType } from './types';

type SkillPayload<T> = T | { data?: T };

function skillData<T>(response: SkillPayload<T>): T {
  if (response && typeof response === 'object' && 'data' in response && response.data !== undefined) return response.data;
  return response as T;
}

export async function listShortDramaSkills(type?: ShortDramaSkillType, includeDisabled = true): Promise<ShortDramaSkill[]> {
  // Optional picker data reports errors locally; it must not flash a global error for the default direction.
  const skills = await readShortDramaResource<ShortDramaSkill[]>(`/short-drama/skills?includeDisabled=${includeDisabled}${type ? `&type=${type}` : ''}`);
  if (!Array.isArray(skills)) throw new Error('技能列表未返回，请检查后台技能服务');
  return skills as ShortDramaSkill[];
}

export async function getShortDramaSkill(name: string): Promise<ShortDramaSkillDetail> {
  const response = await get<SkillPayload<ShortDramaSkillDetail>>(`/short-drama/skills/${encodeURIComponent(name)}`).json();
  const skill = skillData(response);
  if (!skill || skill.name !== name || typeof skill.body !== 'string' || !Array.isArray(skill.files)) throw new Error('技能详情未返回');
  return skill;
}

export interface DramaMarketEntry extends Omit<ShortDramaSkillDetail, 'type'> {
  type: 'system' | 'production' | ShortDramaSkillType;
}

export interface DramaSkillCategory {
  type: DramaMarketEntry['type'];
  title: string;
  editable: boolean;
  projectSelectable: boolean;
}

export async function listDramaSkillCategories(): Promise<DramaSkillCategory[]> {
  const categories = await readShortDramaResource<DramaSkillCategory[]>('/short-drama/skills/categories');
  if (!Array.isArray(categories)) throw new Error('短剧技能分类未返回，请检查后台服务');
  return categories;
}

export async function listDramaSkillMarket(): Promise<DramaMarketEntry[]> {
  const response = await get<SkillPayload<DramaMarketEntry[]>>('/short-drama/skills/market').json();
  const entries = skillData(response);
  if (!Array.isArray(entries)) throw new Error('短剧技能市场未返回，请检查后台服务');
  return entries;
}
