import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAssetPromptDisplay } from '../src/utils/assetPromptDisplay.ts';

test('long production rules open with the asset description and retain the full audit record', () => {
  const skillRules = `【默认导演业务规范】${'共享技能规则'.repeat(800)}`;
  const description = '二十四岁青年县令，深青圆领袍，正侧背三视图保持同一张脸和同一服装。';
  const display = buildAssetPromptDisplay(`${skillRules}\n【本张角色当前形象描述】\n${description}`, description);
  assert.equal(display.summary, description);
  assert.equal(display.full.includes(skillRules), true);
  assert.equal(display.condensed, true);
});

test('short image prompts remain unchanged', () => {
  const display = buildAssetPromptDisplay('青砖县衙清晨空景，窗光从左侧进入。');
  assert.equal(display.summary, display.full);
  assert.equal(display.condensed, false);
});
