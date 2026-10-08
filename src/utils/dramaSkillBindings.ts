import type { ShortDramaProject, ShortDramaSkill, ShortDramaSkillType } from '../api/shortDrama/types';

export interface DramaSkillBindings {
  aestheticSkillName: string;
  directorSkillName: string;
  storyboardSkillNames?: string[];
}

export interface DramaSkillBindingState {
  ready: boolean;
  reason: string;
  aesthetic?: ShortDramaSkill;
  director?: ShortDramaSkill;
}

type SkillProject = Pick<ShortDramaProject, 'aestheticSkillName' | 'directorSkillName' | 'storyboardSkillNames'>;
export function normalizeStoryboardSkills(names?: string[]): string[] {
  return [...new Set((names || []).map(name => name.trim()).filter(Boolean))];
}

/** Include old supplemental bindings so the author can explicitly resolve conflicting styles. */
export function dramaSkillRoleNames(bindings: DramaSkillBindings, type: ShortDramaSkillType, catalog: ShortDramaSkill[]): string[] {
  const primary = type === 'aesthetic' ? bindings.aestheticSkillName : type === 'director' ? bindings.directorSkillName : '';
  return normalizeStoryboardSkills([primary, ...normalizeStoryboardSkills(bindings.storyboardSkillNames)
    .filter(name => catalog.find(skill => skill.name === name)?.type === type)]);
}

/** Editing a creative role replaces its legacy bindings; the asset style stays independent. */
export function selectDramaSkillCategory(bindings: DramaSkillBindings, type: ShortDramaSkillType, name: string, catalog: ShortDramaSkill[]): DramaSkillBindings {
  if (name && !catalog.some(skill => skill.name === name && skill.type === type && skill.enabled))
    throw new Error('请选择该分类中已启用的技能');
  const remaining = normalizeStoryboardSkills(bindings.storyboardSkillNames)
    .filter(selected => {
      const selectedType = catalog.find(skill => skill.name === selected)?.type;
      return selectedType !== type && !(type !== 'aesthetic' && selectedType === 'aesthetic');
    });
  if (type === 'aesthetic') return { ...bindings, aestheticSkillName: name, storyboardSkillNames: remaining };
  if (type === 'director') return { ...bindings, directorSkillName: name, storyboardSkillNames: remaining };
  return { ...bindings, storyboardSkillNames: name ? [...remaining, name] : remaining };
}
export function projectSkillBindings(project?: SkillProject): DramaSkillBindings {
  return { aestheticSkillName: project?.aestheticSkillName || '', directorSkillName: project?.directorSkillName || '',
    ...(project?.storyboardSkillNames !== undefined ? { storyboardSkillNames: normalizeStoryboardSkills(project.storyboardSkillNames) } : {}) };
}

export function dramaSkillBindingsChanged(current: DramaSkillBindings, project?: SkillProject): boolean {
  const saved = projectSkillBindings(project);
  return saved.aestheticSkillName !== current.aestheticSkillName || saved.directorSkillName !== current.directorSkillName
    || JSON.stringify(normalizeStoryboardSkills(saved.storyboardSkillNames)) !== JSON.stringify(normalizeStoryboardSkills(current.storyboardSkillNames));
}

/** Only newly chosen custom directions need the picker catalog; saved directions are checked by the business API. */
export function validateDramaSkillChanges(current: DramaSkillBindings, project: SkillProject | undefined, catalog: ShortDramaSkill[], loaded: boolean): DramaSkillBindingState {
  const saved = projectSkillBindings(project);
  // Validate the entire edited selection, including retained choices in that category.
  if (loaded) return validateDramaSkillBindings({
    aestheticSkillName: current.aestheticSkillName === saved.aestheticSkillName ? '' : current.aestheticSkillName,
    directorSkillName: current.directorSkillName === saved.directorSkillName ? '' : current.directorSkillName,
    storyboardSkillNames: current.storyboardSkillNames,
  }, catalog, true);
  return validateDramaSkillBindings({
    aestheticSkillName: current.aestheticSkillName === saved.aestheticSkillName ? '' : current.aestheticSkillName,
    directorSkillName: current.directorSkillName === saved.directorSkillName ? '' : current.directorSkillName,
    storyboardSkillNames: normalizeStoryboardSkills(current.storyboardSkillNames).filter(name => !normalizeStoryboardSkills(saved.storyboardSkillNames).includes(name)),
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
  if ((bindings.aestheticSkillName || bindings.directorSkillName || bindings.storyboardSkillNames?.length) && !loaded) return { ready: false, reason: '技能列表尚未确认，请刷新后检查当前绑定' };
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
  for (const name of normalizeStoryboardSkills(bindings.storyboardSkillNames)) {
    const skill = catalog.find(item => item.name === name);
    if (!skill) return { ready: false, reason: `分镜技能「${name}」已缺失，请明确重选` };
    if (!skill.enabled) return { ready: false, reason: `分镜技能「${skill.title}」已停用，请明确重选` };
    if (skill.type === 'aesthetic' || skill.type === 'director')
      return { ready: false, reason: `「${skill.title}」请在${skill.type === 'aesthetic' ? '资产配置的视觉风格' : '导演风格'}中选择，每种风格最多一项` };
    const sameType = normalizeStoryboardSkills(bindings.storyboardSkillNames)
      .filter(selected => catalog.find(item => item.name === selected)?.type === skill.type);
    if (sameType.length > 1)
      return { ready: false, reason: '编剧风格最多选择一个，请重新选择' };
  }
  return result;
}
