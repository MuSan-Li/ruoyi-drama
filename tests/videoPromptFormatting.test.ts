import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatVideoPromptText, videoPromptParagraphs, videoPromptSpans } from '../src/utils/videoPromptFormatting.ts';

const contentOnly = (value: string) => value.replace(/\s/gu, '');

test('breaks dense direction into readable paragraphs without rewriting its contents', () => {
  const text = '周慎端着药碗走进屋内，镜头沿门框向右缓移，保留门内的暖光与檐下的冷雨。'.repeat(12);
  const formatted = formatVideoPromptText(text);
  assert.ok(formatted.split('\n\n').length > 1);
  assert.equal(contentOnly(formatted), contentOnly(text));
  assert.equal(formatVideoPromptText(formatted), formatted);
});

test('keeps quoted dialogue together even when its punctuation crosses the paragraph budget', () => {
  const quote = '「' + '不可开门！门外还有人。'.repeat(24) + '」';
  const text = '匪首回头，压低声音说' + quote + '，身后的守卒握紧木闩。' + '镜头保持同侧，雨声不变。'.repeat(12);
  const formatted = formatVideoPromptText(text);
  assert.ok(formatted.includes(quote));
  assert.equal(contentOnly(formatted), contentOnly(text));
});

test('escaped quote marks inside a long quotation do not end dialogue protection', () => {
  const quote = '"他说\\"等等\\"。' + 'Hold the door! Stay with me. '.repeat(20) + '"';
  const text = '周慎说' + quote + '，随后转身。';
  assert.ok(formatVideoPromptText(text).includes(quote));
  assert.equal(contentOnly(formatVideoPromptText(text)), contentOnly(text));
});

test('promotes only existing shot and section labels and remains idempotent', () => {
  const text = '镜头1：药碗落在案上。镜头2：周慎抬眼。\r\n【声音】雨声持续。\n[器物参考] @image3对应药碗。';
  const formatted = formatVideoPromptText(text);
  assert.equal(formatVideoPromptText(formatted), formatted);
  assert.deepEqual(videoPromptParagraphs(text).filter(p => p.kind === 'heading').map(p => p.text), ['镜头1：', '镜头2：', '【声音】', '[器物参考]']);
  assert.equal(contentOnly(formatted), contentOnly(text));
});

test('does not invent a title or a fixed time list for continuous prose', () => {
  const text = '镜头从门内看向院中。周慎说“镜头2：不要念出来！”随后抬手。';
  assert.ok(videoPromptParagraphs(text).every(p => p.kind === 'body'));
  assert.equal(formatVideoPromptText(text), text);
});

test('preserves literal markup, reference indices, decimals and English spaces', () => {
  const text = 'Use @image12 and @video2 at 0.5 speed. Keep the 35mm lens.\n【约束】<img src=x onerror=alert(1)> **原话**。';
  const formatted = formatVideoPromptText(text);
  assert.ok(formatted.includes('Use @image12 and @video2 at 0.5 speed. Keep the 35mm lens.'));
  assert.ok(formatted.includes('<img src=x onerror=alert(1)> **原话**。'));
  assert.equal(contentOnly(formatted), contentOnly(text));
});

test('highlights quoted text and actual media references without deleting any characters', () => {
  const text = '参照@image3，周慎说：“别动！等我回来。”甲答「好。」<script>原文</script>';
  const spans = videoPromptSpans(text);
  assert.equal(spans.map(p => p.text).join(''), text);
  assert.deepEqual(spans.filter(p => p.kind === 'quote').map(p => p.text), ['“别动！等我回来。”', '「好。」']);
  assert.deepEqual(spans.filter(p => p.kind === 'reference').map(p => p.text), ['@image3']);
});

test('handles blank prompts, existing paragraphs and incomplete quotes without content loss', () => {
  assert.equal(formatVideoPromptText(), '');
  assert.deepEqual(videoPromptParagraphs(' \r\n\t'), []);
  const text = '保留原换行。\n\n周慎抬头。\n\n“尚未说完。下一句仍在引号里';
  assert.equal(formatVideoPromptText(text), text);
});
