import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestErrorMessage } from '../src/utils/requestFeedback.ts';

test('generic transport failures use operation context and retain HTTP status for task recovery', () => {
  assert.equal(requestErrorMessage(new Error('Fail Request'), '素材保存失败'), '素材保存失败');
  assert.equal(requestErrorMessage({ message: 'Fail Request', response: { status: 404 } }, '请求失败'), '请求失败（HTTP 404）');
  assert.equal(requestErrorMessage('TypeError: Failed to fetch', '读取失败'), '读取失败');
  assert.equal(requestErrorMessage(new Error('Failed to fetch'), '读取失败'), '读取失败');
});

test('specific business failures are preserved without hiding failed operations', () => {
  assert.equal(requestErrorMessage(new Error('请选择10MB以内的PNG或JPEG图片'), '上传失败'), '请选择10MB以内的PNG或JPEG图片');
  assert.equal(requestErrorMessage({ message: '提交结果待确认', status: 500 }, '请求失败'), '提交结果待确认');
  assert.equal(requestErrorMessage(undefined, '镜头保存失败'), '镜头保存失败');
});
