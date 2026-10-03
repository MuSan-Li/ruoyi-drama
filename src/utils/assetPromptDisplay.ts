export interface AssetPromptDisplay {
  summary: string;
  full: string;
  condensed: boolean;
}

const DEFAULT_SUMMARY_LIMIT = 900;

function normalizePrompt(text: string | undefined): string {
  return (text || '').replace(/\r\n/g, '\n').trim();
}

function clipAtSentence(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const window = text.slice(0, limit + 1);
  const boundary = Math.max(
    window.lastIndexOf('。'),
    window.lastIndexOf('；'),
    window.lastIndexOf('\n'),
  );
  const clipped = boundary >= Math.floor(limit * 0.55)
    ? window.slice(0, boundary + 1)
    : window.slice(0, limit);
  return `${clipped.trimEnd()}…`;
}

/**
 * Asset generations retain the complete production prompt for audit, while the
 * workspace opens with the asset-specific description instead of thousands of
 * characters of shared skill rules.
 */
export function buildAssetPromptDisplay(
  fullPrompt: string | undefined,
  assetDescription?: string,
  limit = DEFAULT_SUMMARY_LIMIT,
): AssetPromptDisplay {
  const full = normalizePrompt(fullPrompt);
  const fallback = normalizePrompt(assetDescription);
  const source = full.length > 1200 && fallback ? fallback : full || fallback || '无提示词记录';
  const summary = clipAtSentence(source, limit);
  return {
    summary,
    full: full || source,
    condensed: (full || source) !== summary,
  };
}
