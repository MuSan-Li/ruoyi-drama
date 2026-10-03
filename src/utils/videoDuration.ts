/** Planning estimates never opt a shot into a fixed provider duration. */
export function videoSeconds(settings: Record<string, unknown>): number | undefined {
  const value = settings.video_seconds;
  return typeof value === 'number' && Number.isInteger(value) && (value === -1 || value > 0) ? value : undefined;
}

export function videoSecondsIssue(settings: Record<string, unknown>): string | undefined {
  const value = settings.video_seconds;
  if (value == null || value === '') return;
  if (videoSeconds(settings) === undefined) return '视频秒数须为正整数或 -1；留空时不提交时长参数';
}

export function withVideoSeconds(settings: Record<string, unknown>, input: string): string {
  const next = { ...settings };
  if (!input.trim()) delete next.video_seconds;
  else next.video_seconds = Number(input);
  return JSON.stringify(next, null, 2);
}
