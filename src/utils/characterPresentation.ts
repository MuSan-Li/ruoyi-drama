import type { ShortDramaCharacter, ShortDramaCharacterAppearance } from '@/api/shortDrama/types';

export function characterImageUrls(value?: string): string[] {
  try { const urls: unknown = JSON.parse(value || '[]'); return Array.isArray(urls) ? urls.map(url => typeof url === 'string' ? url.trim() : '') : []; }
  catch { return []; }
}

export function appearancePreview(appearance?: ShortDramaCharacterAppearance) {
  const urls = characterImageUrls(appearance?.imageUrls);
  const index = appearance?.selectedImageIndex;
  const selected = typeof index === 'number' && Number.isInteger(index) && !!urls[index];
  const candidate = urls.find(Boolean) || '';
  const url = selected ? urls[index!]! : candidate || appearance?.referenceImageUrl || '';
  const source = selected ? 'selected' : candidate ? 'candidate' : url ? 'reference' : 'empty';
  return { url, selected, source, count: urls.filter(Boolean).length };
}

export function characterPreview(character: ShortDramaCharacter) {
  const appearances = character.appearances || [];
  const appearance = appearances.find(item => appearancePreview(item).selected) || appearances.find(item => appearancePreview(item).url);
  if (appearance) return appearancePreview(appearance);
  return { ...appearancePreview(), url: character.referenceImageUrl || '', source: character.referenceImageUrl ? 'reference' : 'empty' };
}
