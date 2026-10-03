import type { ShortDramaProject, ShortDramaSkill } from '../api/shortDrama/types';

export interface DramaSkillBindings {
  aestheticSkillName: string;
  directorSkillName: string;
}

export interface DramaSkillBindingState {
  ready: boolean;
  reason: string;
  aesthetic?: ShortDramaSkill;
  director?: ShortDramaSkill;
}

export function projectSkillBindings(project?: Pick<ShortDramaProject, 'aestheticSkillName' | 'directorSkillName'>): DramaSkillBindings {
  return { aestheticSkillName: project?.aestheticSkillName || '', directorSkillName: project?.directorSkillName || '' };
}

export function dramaSkillBindingsChanged(current: DramaSkillBindings, project?: Pick<ShortDramaProject, 'aestheticSkillName' | 'directorSkillName'>): boolean {
  const saved = projectSkillBindings(project);
  return saved.aestheticSkillName !== current.aestheticSkillName || saved.directorSkillName !== current.directorSkillName;
}

/** Only newly chosen custom directions need the picker catalog; saved directions are checked by the business API. */
export function validateDramaSkillChanges(current: DramaSkillBindings, project: Pick<ShortDramaProject, 'aestheticSkillName' | 'directorSkillName'> | undefined, catalog: ShortDramaSkill[], loaded: boolean): DramaSkillBindingState {
  const saved = projectSkillBindings(project);
  return validateDramaSkillBindings({
    aestheticSkillName: current.aestheticSkillName === saved.aestheticSkillName ? '' : current.aestheticSkillName,
    directorSkillName: current.directorSkillName === saved.directorSkillName ? '' : current.directorSkillName,
  }, catalog, loaded);
}

/** A bound skill defines the visible style; its optional compatibility preset is not its title. */
export function projectAestheticLabel(project: Pick<ShortDramaProject, 'aestheticSkillName'> | undefined, catalog: ShortDramaSkill[], legacyLabel: string): string {
  const name = project?.aestheticSkillName;
  if (!name) return legacyLabel;
  return catalog.find(skill => skill.name === name && skill.type === 'aesthetic')?.title || `${name}（待核对）`;
}

export function validateDramaSkillBindings(bindings: DramaSkillBindings, catalog: ShortDramaSkill[], loaded: boolean, requireAesthetic = false): DramaSkillBindingState {
  if (requireAesthetic && !bindings.aestheticSkillName) return { ready: false, reason: '请选择一个审美技能' };
  if ((bindings.aestheticSkillName || bindings.directorSkillName) && !loaded) return { ready: false, reason: '技能列表尚未确认，请刷新后检查当前绑定' };
  const result: DramaSkillBindingState = { ready: true, reason: '' };
  for (const [field, type, label] of [
    ['aestheticSkillName', 'aesthetic', '审美'], ['directorSkillName', 'director', '导演'],
  ] as const) {
    const name = bindings[field];
    if (!name) continue;
    const skill = catalog.find(item => item.name === name && item.type === type);
    if (!skill) return { ready: false, reason: `${label}技能「${name}」已缺失或类型已改变，请明确重选` };
    if (!skill.enabled) return { ready: false, reason: `${label}技能「${skill.title}」已停用，请明确重选` };
    result[type] = skill;
  }
  return result;
}
