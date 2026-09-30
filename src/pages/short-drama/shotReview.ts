import type { ShortDramaStoryboard } from '@/api/shortDrama/types';

export interface TimingPlan {
  spoken_text?: string;
  speech_rate?: number;
  action_seconds?: number;
  pause_seconds?: number;
  action_note?: string;
  review_note?: string;
  measured_audio_seconds?: number;
}
export function continuityOf(shot: ShortDramaStoryboard): Record<string, any> {
  try { const c = JSON.parse(shot.continuityJson || '{}'); return c && typeof c === 'object' && !Array.isArray(c) ? c : {}; }
  catch { return {}; }
}
// This is an editable production estimate, not a linguistic or provider guarantee.
// Numbers and Latin tokens are conservatively expanded; an actual voice track takes precedence.
export function spokenUnits(text: string) {
  const latin = text.match(/[A-Za-z]+/g) || [];
  return (text.match(/[\u3400-\u9fff]/g) || []).length
    + (text.match(/\d/g) || []).length * 1.5
    + latin.reduce((n, word) => n + word.length, 0);
}
export function reviewShot(shot: ShortDramaStoryboard) {
  const c = continuityOf(shot);
  const plan: TimingPlan = c.timing || {};
  const inferred = [...(shot.sourceText || '').matchAll(/「([^」]+)」/g)].map(m => m[1]).join(' ');
  const spoken = typeof plan.spoken_text === 'string' ? plan.spoken_text : inferred;
  const rate = Number(plan.speech_rate) || 4;
  const units = Math.max(spokenUnits(spoken), spokenUnits(inferred));
  const measured = Number(plan.measured_audio_seconds);
  const speech = measured > 0 ? measured : units / Math.min(5, Math.max(2, rate));
  const action = Math.max(0, Number(plan.action_seconds) || 0);
  const pauses = plan.pause_seconds == null ? (spoken ? 2 : 0) : Math.max(0, Number(plan.pause_seconds));
  const required = Math.ceil((speech + action + pauses) * 10) / 10;
  const duration = Number(shot.durationSeconds) || 0;
  const issues: string[] = [];
  if (required > duration + 0.05) issues.push(`内容至少约 ${required} 秒，超出 ${(required - duration).toFixed(1)} 秒`);
  if (!c.timing) issues.push('未拆分对白、动作与停顿时间');
  if (!shot.sourceText || !c.narrative_cause || !c.story_action || !c.story_result || !c.start_state || !c.end_state) issues.push('因果或起止状态不完整');
  if (/\+|急推|环绕/.test(shot.cameraMove || '')) issues.push('复核组合运镜或强烈运镜的叙事必要性');
  return { c, plan, spoken, units, speech: Math.round(speech * 10) / 10, action, pauses, required, duration, issues, overflow: required > duration + 0.05 };
}
