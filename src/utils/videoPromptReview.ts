/** Advisory checks for actionable video directions, not a guarantee of model output quality. */
export interface VideoPromptShot {
  videoPrompt?: string;
  durationSeconds?: number;
  locationName?: string;
  charactersJson?: string;
  continuityJson?: string;
  sourceText?: string;
}

export interface VideoPromptBeat {
  start: number;
  end: number;
  direction: string;
}

function objectOf(json?: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(json || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
}

/** Seconds can be decimal, separated with Chinese or ASCII range notation. */
export function videoPromptBeats(prompt: string): VideoPromptBeat[] {
  const timeline = prompt.match(/【[^】\n]*(?:时间节拍|动作节拍|时间轴|时序动作|时间分配)[^】\n]*】([\s\S]*?)(?=【|$)/)?.[1];
  // Model JSON may keep an explicit timeline on one line. Normalize only that section,
  // so intervals mentioned in dialogue or camera notes are never counted as beats.
  const text = timeline === undefined ? prompt : timeline.replace(/[;；]\s*(?=\d)/g, '\n');
  const ranges = [...text.matchAll(/(?:^|\n)\s*(?:[-*•]\s*)?(?:【[^】\n]+】\s*)?(\d+(?:\.\d+)?)\s*(?:秒|s)?\s*(?:—|–|-|～|~|至|到)\s*(\d+(?:\.\d+)?)\s*(?:秒|s)\s*[:：]\s*/gim)];
  return ranges.map((match, index) => ({
    start: Number(match[1]),
    end: Number(match[2]),
    direction: text.slice((match.index || 0) + match[0].length, ranges[index + 1]?.index ?? text.length).split(/\n\s*【/)[0].trim(),
  }));
}

function castNames(json?: string): string[] {
  try {
    const value: unknown = JSON.parse(json || '[]');
    if (!Array.isArray(value)) return [];
    return value.flatMap(item => {
      const name = typeof item === 'string' ? item : item?.name;
      return typeof name === 'string' && name.trim() && !/^\d+$/.test(name.trim()) ? [name.trim()] : [];
    });
  } catch { return []; }
}

/** Accepts natural Chinese and merged sections; headings alone never satisfy a content check. */
export function reviewVideoPrompt(shot: VideoPromptShot) {
  const continuity = objectOf(shot.continuityJson);
  const source = continuity.source_media;
  const directInsert = !!source && typeof source === 'object' && (source as Record<string, unknown>).mode === 'direct_insert';
  const prompt = (shot.videoPrompt || '').trim();
  const beats = videoPromptBeats(prompt);
  const issues: string[] = [];
  const add = (issue: string) => issues.push(`视频提示词：${issue}`);
  if (directInsert) return { issues, beats, directInsert };
  if (!prompt) {
    add('尚未填写生成指令');
    return { issues, beats, directInsert };
  }
  const content = prompt.replace(/【[^】]*】/g, '');
  const timelineDeclared = /【[^】]*(?:时间节拍|动作节拍|时间轴|时序动作|时间分配)[^】]*】/.test(prompt);
  const timed = timelineDeclared || beats.length > 0;
  if (timed && !/(首帧|起始帧|起始图|起始画面|第一帧|参考图|定妆图)/.test(content)) add('缺少首帧或参考图锚定');
  const names = castNames(shot.charactersJson);
  const missingCast = names.filter(name => !content.includes(name));
  if (missingCast.length) add(`未锚定出场身份：${missingCast.join('、')}`);
  else if (!names.length && !/(@[^\s，。；：:【】]+|人物\s*[:：]\s*\S|角色\s*[:：]\s*\S|主角|精灵|男孩|女孩|男人|女人|皇帝|太子|内侍|军士|空镜|无人|为主体)/.test(content)) add('缺少可辨认的主体身份或空镜说明');
  if (shot.locationName?.trim() ? !content.includes(shot.locationName.trim()) : !/(场景\s*[:：]\s*\S|地点\s*[:：]\s*\S|室内|室外|书斋|书房|门廊|庭院|街道|殿内|走廊|海边|林中|厨房)/.test(content)) add('缺少当前场景锚定');

  // Only a user-set video duration constrains production review; durationSeconds is a planning estimate.
  const duration = Number(continuity.video_seconds);
  const tolerance = 0.001; // Ignore only sub-millisecond decimal rounding, not visible time gaps.
  if (timelineDeclared && !beats.length) add('缺少从 0 秒到镜尾的显式连续秒段');
  if (beats.length) {
    if (Math.abs(beats[0].start) > tolerance) add(`秒段未从 0 秒开始（首段 ${beats[0].start} 秒）`);
    beats.forEach((beat, index) => {
      if (beat.end <= beat.start) add(`第 ${index + 1} 段结束须晚于开始`);
      if (Number.isFinite(duration) && duration > 0 && beat.end > duration + tolerance) add(`第 ${index + 1} 段超过镜头 ${duration} 秒`);
      if (!beat.direction || !beat.direction.replace(/【[^】]*】|[\s。，；]/g, '')) add(`第 ${index + 1} 段缺少表演或画面内容`);
      if (index > 0) {
        const difference = beat.start - beats[index - 1].end;
        if (difference > tolerance) add(`第 ${index}、${index + 1} 段之间缺少 ${Number(difference.toFixed(2))} 秒安排`);
        if (difference < -tolerance) add(`第 ${index}、${index + 1} 段重叠 ${Number((-difference).toFixed(2))} 秒`);
      }
    });
    if (Number.isFinite(duration) && duration > 0 && Math.abs(beats[beats.length - 1].end - duration) > tolerance) add(`秒段结束 ${beats[beats.length - 1].end} 秒与镜头 ${duration} 秒不一致`);
  }

  const performance = timed ? beats.map(beat => beat.direction).join(' ') : content;
  if (!/(抬|垂|转|握|松|推|收|展|递|拿|放|落|提|摸|触|看|望|凝视|注视|停|保持|静止|呼吸|眨|睁|闭|说|问|答|笑|摇|点|走|迈|退|伸|摊|写|签|翻|压|扶|拂|扫|俯|倾|偏|沉|颤|浮|悬|投影|发光|熄|闪|流动|吹|蒸汽|雨|雪|云)/.test(performance)) add('缺少可执行动作或静态表演');
  if (!/(固定机位|机位固定|锁定机位|固定镜头|静态镜头|缓推|慢推|缓移|平移|跟拍|推轨|摇镜|拉远|拉近|特写|近景|中景|全景|俯拍|仰拍|景深|焦距|对焦|镜头[^。；\n]{0,24}(?:微晃|摇|跟|移焦|收近|抬|落|切))/.test(content)) add('缺少景别、机位或运镜指令');
  if (!/(烛光|烛火|月光|暖光|冷光|侧光|背光|柔光|顶光|自然光|散射光|天光|光源|光色|色温|灯光|光线|低照度|逆光|日光|阳光|霓虹|照明)/.test(content)) add('缺少明确光源或光色');
  if (!/(无对白|无台词|静默|静音|环境声|呼吸声|脚步声|纸声|翻页声|画外|旁白|声源|声音\s*[:：]\s*\S|声线|发声|低声|轻声|同期声|口型|拟音|雨声|风声|哭声|咳嗽|轰鸣|回响|炮响|声响|[\p{Script=Han}]{1,12}(?:声|轻响))/u.test(content)) add('缺少对白声源或静默、环境声安排');
  const timing = continuity.timing;
  const spoken = timing && typeof timing === 'object' ? (timing as Record<string, unknown>).spoken_text : '';
  if ((typeof spoken === 'string' && spoken.trim() || /「[^」]+」/.test(shot.sourceText || ''))
    && !/(画外声|旁白|同期声|声源|口型)/.test(content)
    && (timed || !/[\p{Script=Han}A-Za-z][^。\n「“]{0,36}(?:说|问|答|喊|叫|吼|喝令|催|低声|轻声|嘀咕|喃喃)[^。\n「“]{0,12}[「“]/u.test(content))) add('有对白但未说明声源或口型归属');
  if (timed && !/(尾帧|末帧|最后一帧|结束画面|镜尾|结尾停留|定格|最后\s*\d+(?:\.\d+)?\s*秒|结束\s*[:：]\s*\S)/.test(content)) add('缺少明确镜尾状态与承接');
  if (!timed) {
    let cursor = 0;
    const dialogue = (shot.sourceText || '').replace(/\\n/g, '\n');
    for (const line of dialogue.matchAll(/(?:^|\n)\s*([^：:\n]{1,24})[：:]\s*[「“]([^」”]+)[」”]/g)) {
      const speaker = line[1].replace(/（[^）]*）|\([^)]*\)/g, '').replace(/(?:回答|低声说|说|问|答|心声|画外音)$/, '').trim();
      if (/屏幕|字幕|题字|动作|环境|场景|镜头/.test(speaker)) continue;
      const at = content.indexOf(line[2], cursor);
      if (at < 0) add(`对白缺失或乱序：「${line[2]}」`);
      else {
        if (!content.slice(cursor, at).includes(speaker)) add(`对白未归属发言人${speaker}`);
        cursor = at + line[2].length;
      }
    }
  }
  // Spoken requests to enter do not by themselves describe a doorway action.
  const unquoted = (value: string) => value.replace(/「[^」]*」|“[^”]*”/g, '');
  const doorAction = unquoted(`${shot.sourceText || ''}\n${content}`);
  if (/(?:进屋|进门|入库|进入(?:屋|房|库)|走入(?:屋|房|库)|出门|出屋|走出(?:屋|房|库)|跨[^。；\n]{0,10}门槛)/.test(doorAction)) {
    const staging = unquoted(content);
    if (!/(?:门外|门内|屋外|屋内|库外|库内|室外|室内)/.test(staging)) add('进出门动作须核对人物起始一侧与抵达位置');
    if (!/(?:跨[^。；\n]{0,10}门槛|越过门槛|穿过门口|从[^。；\n]{0,24}(?:走入|走出|进入|走到))/.test(staging)) add('进出门动作须写清跨门路线，开门不等于人物已经到位');
    if (!/(?:摄影机|机位|镜头)[^。；\n]{0,32}(?:门外|门内|屋外|屋内|库外|库内|室外|室内)/.test(staging)) add('进出门动作须说明摄影机所在一侧，门扇方向与人物行进方向分别核对');
  }
  return { issues, beats, directInsert };
}
