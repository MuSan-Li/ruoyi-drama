import type { ShortDramaStoryboard } from '@/api/shortDrama/types';
import { reviewVideoPrompt } from '../../utils/videoPromptReview.ts';

export interface TimingPlan {
  spoken_text?: string;
  speech_rate?: number;
  action_seconds?: number;
  pause_seconds?: number;
  action_note?: string;
  review_note?: string;
  pacing_note?: string;
  measured_audio_seconds?: number;
  strict_fill?: boolean;
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
function sourceSpeech(source: string) {
  const lines: string[] = [];
  const pattern = /「([^」]+)」|“([^”]+)”|^\s*([\p{Script=Han}A-Za-z0-9（）()· ]{1,24})\s*[:：]\s*([^\r\n]+)/gmu;
  for (const match of source.replace(/\\n/g, '\n').matchAll(pattern)) {
    if (match[1] || match[2]) lines.push(match[1] || match[2]);
    else if (!/(起始状态|结束状态|场景|镜头|画面|音效|动作|提示|环境|承接|道具)/.test(match[3])) {
      const quoted = [...match[4].matchAll(/「([^」]+)」|“([^”]+)”/g)].map(m => m[1] || m[2]);
      lines.push(...(quoted.length ? quoted : [match[4].trim()]));
    }
  }
  return lines.join(' ');
}
export function reviewShot(shot: ShortDramaStoryboard) {
  const c = continuityOf(shot);
  const plan: TimingPlan = c.timing || {};
  const inferred = sourceSpeech(shot.sourceText || '');
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
  if (required > duration + 0.05) issues.push(`内容估算约 ${required} 秒，当前安排 ${duration} 秒，可结合实际表演调整`);
  const pacingNote = typeof plan.pacing_note === 'string' ? plan.pacing_note.trim() : '';
  if (duration >= 8 && speech > 0 && duration - speech > Math.max(3, speech * 0.75) + 0.05
      && (!pacingNote || /^(待补充|同上|略|TODO|暂无)[。；;\s]*$/i.test(pacingNote))) {
    issues.push(`对白估算约 ${speech.toFixed(1)} 秒，当前安排 ${duration} 秒，可留意动作和停顿的节奏`);
  }
  const shortestIntegerDuration = Math.max(1, Math.ceil(required - 0.000001));
  if (plan.strict_fill === true && duration > shortestIntegerDuration) {
    issues.push(`有效内容估算约 ${required} 秒，当前安排 ${duration} 秒，可根据动作结果与反应决定结束点`);
  }
  if (!c.timing) issues.push('未拆分对白、动作与停顿时间');
  if (!shot.sourceText || !c.narrative_cause || !c.story_action || !c.story_result || !c.start_state || !c.end_state) issues.push('因果或起止状态不完整');
  if (/\+|急推|环绕/.test(shot.cameraMove || '')) issues.push('复核组合运镜或强烈运镜的叙事必要性');
  issues.push(...reviewVideoPrompt(shot).issues);
  return { c, plan, spoken, units, speech: Math.round(speech * 10) / 10, action, pauses, required, duration, issues, overflow: required > duration + 0.05 };
}
