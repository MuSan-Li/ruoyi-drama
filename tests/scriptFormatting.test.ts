import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatScriptText, scriptParagraphs } from '../src/utils/scriptFormatting.ts';

test('formats compact screenplay paragraphs without changing dialogue or story dates', () => {
  const text = '《青芜长明》第一集：第一炮\r\n一　旧库房。崇祯十一年冬。\r\n周先进入暗库。\r\n朱承晏（低声）：我先看看。\r\n三个月后，车架完成。';
  const formatted = formatScriptText(text);
  assert.equal(formatted.replace(/\s/g, ''), text.replace(/\s/g, ''));
  assert.ok(formatted.includes('暗库。\n\n朱承晏'));
  assert.equal(formatScriptText(formatted), formatted);
  assert.deepEqual(scriptParagraphs(formatted).map(item => item.kind), ['title', 'scene', 'action', 'dialogue', 'action']);
});

test('removes presentation markup while keeping user specified duration and literal HTML as text', () => {
  const formatted = formatScriptText('# 《测试》\n## 一　屋内。日。\n**周慎**：<img src=x onerror=alert(1)>\n目标时长：用户指定两分钟。');
  assert.ok(formatted.includes('用户指定两分钟'));
  assert.equal(scriptParagraphs(formatted)[2]?.speech, '<img src=x onerror=alert(1)>');
  assert.equal(formatScriptText(), '');
});
