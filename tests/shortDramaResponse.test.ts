import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  requireShortDramaBusinessJson,
  requireShortDramaEventStream,
  requireShortDramaStreamComplete,
  ShortDramaResponseError,
} from '../src/utils/shortDramaResponse.ts';

test('HTTP 200 NOT_LOGIN JSON is rejected before the SSE reader is opened', async () => {
  const response = new Response(JSON.stringify({ code: 401, msg: 'NOT_LOGIN' }), { headers: { 'Content-Type': 'application/json' } });
  await assert.rejects(requireShortDramaEventStream(response), (error: unknown) => {
    assert.ok(error instanceof ShortDramaResponseError);
    assert.equal(error.loginExpired, true);
    assert.equal(error.httpStatus, 200);
    assert.equal(error.businessCode, 401);
    return true;
  });
});

test('HTTP 401 and 403 trigger login recovery even without a JSON body', async () => {
  for (const status of [401, 403]) {
    await assert.rejects(requireShortDramaEventStream(new Response('denied', { status })), (error: unknown) => {
      assert.ok(error instanceof ShortDramaResponseError);
      assert.equal(error.loginExpired, true);
      return true;
    });
  }
});

test('an HTML page or a success JSON envelope cannot impersonate a completed event stream', async () => {
  for (const response of [new Response('<html />', { headers: { 'Content-Type': 'text/html' } }), new Response('{"code":200}', { headers: { 'Content-Type': 'application/json' } })]) {
    await assert.rejects(requireShortDramaEventStream(response), /未返回事件流/);
  }
  await requireShortDramaEventStream(new Response('event: complete\ndata: {}\n\n', { headers: { 'Content-Type': 'text/event-stream; charset=UTF-8' } }));
});

test('JSON review endpoints check business codes rather than HTTP success', async () => {
  await assert.rejects(requireShortDramaBusinessJson(new Response('{"code":403,"msg":"NOT_LOGIN"}', { headers: { 'Content-Type': 'application/json' } })), (error: unknown) => error instanceof ShortDramaResponseError && error.loginExpired);
  assert.equal((await requireShortDramaBusinessJson(new Response('{"code":200,"data":26}', { headers: { 'Content-Type': 'application/json' } }))).data, 26);
});

test('end of connection alone is not generation success, and creation needs a project ID', () => {
  assert.throws(() => requireShortDramaStreamComplete(false), /未收到完整完成确认/);
  assert.throws(() => requireShortDramaStreamComplete(true, null), /未收到完整完成确认/);
  assert.doesNotThrow(() => requireShortDramaStreamComplete(true, '2100000000000000000'));
  assert.doesNotThrow(() => requireShortDramaStreamComplete(true));
});
