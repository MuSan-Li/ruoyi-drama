import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { reviewVideoPrompt, videoPromptBeats } from '../src/utils/videoPromptReview.ts';
import { reviewShot } from '../src/pages/short-drama/shotReview.ts';

const silent = `【参考与边界】参考首帧、朱承晏定妆图，太子书斋，主体保持既有服装与座位。
【镜头与运镜】近景，固定机位，不切镜。
【时间节拍】
0—4秒：朱承晏注视青瓷饭碗，手指缓慢摸到袖口后保持静止。
【对白与口型】无对白，嘴唇放松闭合。
【光色与材质】左侧烛火暖光，右侧窗外冷光，绸料保留细纹。
【声音】只有轻微呼吸声、衣料摩擦，保持房间底噪。
【结束与承接】尾帧落在手指触袖口状态，视线仍向碗，承接下一镜确认年月。
【约束】不新增人物、字幕；保留轴线。`;
const base = { videoPrompt: silent, durationSeconds: 4, locationName: '太子书斋', charactersJson: '[{"name":"朱承晏"}]' };

test('brief dialogue needs a reason for a twelve-second allocation, even with padded action budgets', () => {
  const shot = { ...base, durationSeconds: 12, sourceText: '老者：「大人可算醒了！南门来了溃兵要抢粮！」',
    continuityJson: JSON.stringify({ timing: { speech_rate: 3.8, action_seconds: 4, pause_seconds: 2 } }) };
  assert.match(reviewShot(shot).issues.join(), /可留意动作/);
  assert.doesNotMatch(reviewShot({ ...shot, durationSeconds: 7,
    continuityJson: JSON.stringify({ timing: { speech_rate: 3.8, action_seconds: 1, pause_seconds: 1 } }) }).issues.join(), /可留意动作/);
  const justified = { ...shot, continuityJson: JSON.stringify({ timing: { measured_audio_seconds: 4.5,
    action_seconds: 4, pause_seconds: 2, pacing_note: '5至9秒独占搬桌堵门，9至11秒撞门后改变逃走决定' } }) };
  assert.doesNotMatch(reviewShot(justified).issues.join(), /可留意动作/);
  const strictFill = { ...base, durationSeconds: 8, continuityJson: JSON.stringify({ timing: {
    spoken_text: '', speech_rate: 4, action_seconds: 6.2, pause_seconds: 0, strict_fill: true,
  } }) };
  assert.match(reviewShot(strictFill).issues.join(), /决定结束点/);
  assert.doesNotMatch(reviewShot({ ...strictFill, durationSeconds: 7 }).issues.join(), /决定结束点/);
  for (const sourceText of ['老者：大人可算醒了！南门来了溃兵要抢粮！', '老者：“大人可算醒了！南门来了溃兵要抢粮！”']) {
    assert.match(reviewShot({ ...shot, sourceText }).issues.join(), /可留意动作/);
  }
  assert.doesNotMatch(reviewShot({ ...base, durationSeconds: 12 }).issues.join(), /可留意动作/);
});

test('a short silent four-second single shot passes without arbitrary word or beat minimums', () => {
  assert.deepEqual(reviewVideoPrompt(base).issues, []);
  assert.equal(reviewVideoPrompt(base).beats.length, 1);
});

test('CG sprite and transparent projection actions can use merged natural Chinese sections', () => {
  const prompt = `以本镜起始图锁定 Codex 精灵、御书房和朱承晏；中景固定镜头，月光冷光配烛火暖光。
0至1.5秒：朱承晏抬眼，Codex 精灵悬浮于肩旁，抬手。
1.5秒—4秒：半透明投影面板展开，精灵保持悬浮，朱承晏注视空白卡片。
4-6s：Codex 轻声说「只核查这三笔」。声音由精灵发出，口型只属于精灵，朱承晏不动嘴。
末帧精灵和面板停留，承接下一镜；环境声为室内呼吸和低电流拟音，不覆盖对白。`;
  const result = reviewVideoPrompt({ videoPrompt: prompt, durationSeconds: 6, locationName: '御书房', charactersJson: '["朱承晏","Codex"]' });
  assert.deepEqual(result.issues, []);
  assert.equal(result.beats.length, 3);
});

test('empty and thin summaries fail on missing production content rather than headings', () => {
  assert.match(reviewVideoPrompt({ durationSeconds: 4 }).issues.join(), /尚未填写/);
  const thin = '4秒16:9单镜，手部与脸部近景固定或缓推。起始：朱承晏坐左侧小桌，手停在青瓷饭碗旁。过程与结束：手指摸到袖口。其余按角色顺序发声，无字幕。';
  const result = reviewVideoPrompt({ ...base, videoPrompt: thin });
  assert.match(result.issues.join(), /场景/);
  assert.match(result.issues.join(), /光源或光色/);
  assert.doesNotMatch(result.issues.join(), /显式连续秒段/);
});

const natural = '太子书斋，朱承晏站在书桌前，顾怀安在门边，左侧烛光照着他的袖口。中景固定在桌侧，朱承晏把文书放到桌上，抬眼问「今年？」顾怀安低声答「甲申。」朱承晏的手停在纸上，随后合起文书，看向门口。环境声是纸声与门外风声。';
const naturalShot = { videoPrompt: natural, durationSeconds: 4, locationName: '太子书斋', charactersJson: '["朱承晏","顾怀安"]', sourceText: '朱承晏：「今年？」\n顾怀安：「甲申。」' };
test('continuous director prose supports inline dialogue without eight headings or second ranges', () => {
  const result = reviewVideoPrompt(naturalShot);
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.beats, []);
});
test('prose still checks exact dialogue order and speaker attribution', () => {
  assert.match(reviewVideoPrompt({ ...naturalShot, videoPrompt: natural.replace('今年？', '现在什么年？') }).issues.join(), /对白缺失/);
  assert.match(reviewVideoPrompt({ ...naturalShot, videoPrompt: natural.replace('顾怀安低声答', '朱承晏低声答') }).issues.join(), /发言人顾怀安/);
  assert.match(reviewVideoPrompt({ ...naturalShot, videoPrompt: natural.replace('烛光', '色彩') }).issues.join(), /光源或光色/);
});

test('identifies timing gaps, overlaps, boundaries, reversed ranges, and incomplete tail', () => {
  const cases: [string, RegExp][] = [
    ['1—4秒：他保持静止。', /未从 0/],
    ['0—1秒：他保持静止。\n2—4秒：他抬手。', /之间缺少 1 秒/],
    ['0—2秒：他保持静止。\n1.5—4秒：他抬手。', /重叠 0.5 秒/],
    ['0—5秒：他保持静止。', /超过镜头 4 秒/],
    ['0—3秒：他保持静止。', /结束 3 秒与镜头 4 秒不一致/],
    ['0—2秒：他保持静止。\n2—1秒：他抬手。', /结束须晚于开始/],
  ];
  for (const [range, expected] of cases) {
    const prompt = silent.replace('0—4秒：朱承晏注视青瓷饭碗，手指缓慢摸到袖口后保持静止。', range);
    assert.match(reviewVideoPrompt({ ...base, videoPrompt: prompt, continuityJson: '{"video_seconds":4}' }).issues.join(), expected);
  }
});

test('parses decimal seconds, standard Chinese aliases and optional same-line heading', () => {
  const beats = videoPromptBeats('【分段表演】0秒到1.25秒：抬手。\n- 1.25～4秒：保持静止。');
  assert.deepEqual(beats.map(({ start, end }) => [start, end]), [[0, 1.25], [1.25, 4]]);
});

test('time intervals elsewhere in voice directions are not treated as timeline beats', () => {
  assert.equal(videoPromptBeats('对白在1—3秒发声；时间预算为0—4秒。').length, 0);
});

test('default model JSON can keep semicolon-separated timeline beats on one line', () => {
  const prompt = silent.replace('0—4秒：朱承晏注视青瓷饭碗，手指缓慢摸到袖口后保持静止。',
    '0—2秒：朱承晏注视青瓷饭碗；2—4秒：手指摸到袖口后保持静止。')
    .replaceAll('\n', '').replace('无对白，嘴唇放松闭合。', '无对白，嘴唇闭合；1—3秒是呼吸声描述。');
  const result = reviewVideoPrompt({ ...base, videoPrompt: prompt });
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.beats.map(({ start, end }) => [start, end]), [[0, 2], [2, 4]]);
});

test('empty headings cannot impersonate actionable content', () => {
  const headings = '【首帧与场景】【主体身份】【镜头与运镜】【摄影与光色】【声音】【尾帧】\n0—4秒：';
  const result = reviewVideoPrompt({ ...base, videoPrompt: headings });
  assert.match(result.issues.join(), /缺少表演或画面内容/);
  assert.match(result.issues.join(), /景别、机位/);
  assert.match(result.issues.join(), /光源或光色/);
  assert.match(result.issues.join(), /声安排/);
});

test('anchoring names and scene rejects an otherwise complete copied prompt', () => {
  assert.match(reviewVideoPrompt({ ...base, charactersJson: '["朱廷照"]' }).issues.join(), /未锚定出场身份：朱廷照/);
  assert.match(reviewVideoPrompt({ ...base, locationName: '御书房' }).issues.join(), /场景锚定/);
});

test('a dialogue shot needs declared voice source or lip sync ownership', () => {
  const prompt = silent.replace('无对白，嘴唇放松闭合。', '朱承晏说「先查这笔账」。');
  const result = reviewVideoPrompt({ ...base, videoPrompt: prompt, continuityJson: '{"timing":{"spoken_text":"先查这笔账"}}' });
  assert.match(result.issues.join(), /有对白但未说明声源或口型归属/);
});

test('directly inserted real footage does not require synthetic generation directions', () => {
  const result = reviewVideoPrompt({ durationSeconds: 4, continuityJson: '{"source_media":{"mode":"direct_insert","filename":"实拍.mp4"}}' });
  assert.deepEqual(result.issues, []);
  assert.equal(result.directInsert, true);
});

test('malformed continuity JSON is safe and never suppresses generation checks', () => {
  assert.match(reviewVideoPrompt({ continuityJson: '{bad', durationSeconds: 4 }).issues.join(), /尚未填写/);
});

test('reviewShot exposes video issues through its existing UI issues contract', () => {
  const continuityJson = JSON.stringify({ timing: { spoken_text: '', action_seconds: 1, pause_seconds: 0 }, narrative_cause: '醒来', story_action: '摸袖口', story_result: '发现丝绸', start_state: '坐着', end_state: '注视袖口' });
  const shot = { ...base, continuityJson, sourceText: '醒来后摸袖口', projectId: '1', scriptId: '1', sceneNo: 1 };
  assert.deepEqual(reviewShot(shot).issues, []);
  assert.match(reviewShot({ ...shot, videoPrompt: '缓推。' }).issues.join(), /视频提示词：/);
});

test('the actual preceding v3 pilot has all 25 legacy prompts flagged', t => {
  const file = new URL('../artifacts/甲申逆命/Codex二创/制作包-v3-Codex精灵/11-最终项目回读.json', import.meta.url);
  let saved: { storyboards: Parameters<typeof reviewVideoPrompt>[0][] };
  try { saved = JSON.parse(readFileSync(file, 'utf8')); }
  catch { t.skip('Local production artifacts are deliberately not part of the repository.'); return; }
  assert.equal(saved.storyboards.length, 25);
  assert.equal(saved.storyboards.filter(shot => reviewVideoPrompt(shot).issues.length > 0).length, 25);
});

test('the historical v4 pilot retains structural checks and exposes missing pacing evidence without changing assets', t => {
  const file = new URL('../artifacts/甲申逆命/Codex二创/制作包-v4-视频导演精修/04-拟同步完整项目.json', import.meta.url);
  let saved: { storyboards: Parameters<typeof reviewShot>[0][] };
  try { saved = JSON.parse(readFileSync(file, 'utf8')); }
  catch { t.skip('Local production artifacts are deliberately not part of the repository.'); return; }
  assert.equal(saved.storyboards.length, 25);
  assert.equal(saved.storyboards.reduce((sum, shot) => sum + (shot.durationSeconds || 0), 0), 180);
  const pacingReview: number[] = [];
  for (const shot of saved.storyboards) {
    const issues = reviewShot(shot).issues;
    assert.deepEqual(issues.filter(issue => !issue.includes('可留意动作')), [], `shot ${shot.sceneNo}`);
    if (issues.some(issue => issue.includes('可留意动作'))) pacingReview.push(shot.sceneNo!);
    const beats = reviewVideoPrompt(shot).beats;
    assert.equal(beats[0].start, 0, `shot ${shot.sceneNo} starts at zero`);
    assert.equal(beats[beats.length - 1].end, shot.durationSeconds, `shot ${shot.sceneNo} covers full duration`);
  }
  assert.deepEqual(pacingReview, [9, 10, 15, 16, 17, 19, 21, 22, 23, 24, 25]);
});
