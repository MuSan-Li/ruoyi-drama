import type { ShortDramaCharacter, ShortDramaLocation } from '../api/shortDrama/types';

/** A successful HTTP envelope with no usable assets is not a successful analysis. */
export function requireAnalyzedAssets(result: unknown) {
  if (!result || typeof result !== 'object') throw new Error('资产分析未返回可读取的项目结果，已保存正文和现有资产保留');
  const detail = result as { characters?: unknown; locations?: unknown };
  const validName = (entry: unknown) => !!entry && typeof entry === 'object'
    && typeof (entry as { name?: unknown }).name === 'string' && !!(entry as { name: string }).name.trim();
  if (!Array.isArray(detail.characters) || !detail.characters.length || !detail.characters.every(validName)) {
    throw new Error('资产分析未返回有效角色档案，未进入资产配置；已保存正文和现有资产保留');
  }
  if (!Array.isArray(detail.locations) || !detail.locations.length || !detail.locations.every(validName)) {
    throw new Error('资产分析未返回有效场景档案，未进入资产配置；已保存正文和现有资产保留');
  }
  return { characters: detail.characters as ShortDramaCharacter[], locations: detail.locations as ShortDramaLocation[] };
}
