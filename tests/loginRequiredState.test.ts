import assert from 'node:assert/strict';
import { test } from 'node:test';
import { beginLoginRequired, isLoginRequiredPending, isLoginRequiredResponse, resetLoginRequired } from '../src/utils/loginRequiredState.ts';

test('a burst and late responses share one recovery until login succeeds', () => {
  resetLoginRequired();
  assert.equal(beginLoginRequired(), true);
  for (let i = 0; i < 30; i++) assert.equal(beginLoginRequired(), false);
  assert.equal(isLoginRequiredPending(), true);
  resetLoginRequired();
  assert.equal(isLoginRequiredPending(), false);
  assert.equal(beginLoginRequired(), true);
  resetLoginRequired();
});

test('only missing authentication triggers login recovery; permission and business failures remain errors', () => {
  for (const code of [401, '401', 'NOT_LOGIN']) assert.equal(isLoginRequiredResponse(200, code), true);
  assert.equal(isLoginRequiredResponse(401), true);
  assert.equal(isLoginRequiredResponse(403, 403, 'NOT_LOGIN'), true);
  assert.equal(isLoginRequiredResponse(403, 403, '没有访问权限'), false);
  assert.equal(isLoginRequiredResponse(500, 500, '请求失败'), false);
});
