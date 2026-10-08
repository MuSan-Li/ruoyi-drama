export function storyboardVideoModel(continuityJson?: string, fallback = ''): string {
  try {
    const settings: unknown = JSON.parse(continuityJson || '{}');
    if (settings && typeof settings === 'object' && 'video_model' in settings
      && typeof settings.video_model === 'string' && settings.video_model.trim()) return settings.video_model.trim();
  }
  catch { /* Legacy panels use the configured catalog default. */ }
  return fallback;
}
