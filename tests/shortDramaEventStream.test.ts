import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readDramaEventStream, createDramaEventParser } from '../src/utils/shortDramaEventStream.ts';

test('all three text stages share framing across UTF-8 boundaries and CRLF', async () => {
  const bytes = new TextEncoder().encode(': heartbeat\r\nevent: progress\r\ndata: {"phase":"assets",\r\ndata: "message":"竹布风筝"}\r\n\r\nevent: complete\ndata: {"state":"done"}');
  const events: unknown[] = [];
  const body = new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); } });
  await readDramaEventStream(new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }), (event, data) => events.push([event, data]));
  assert.deepEqual(events, [['progress', { phase: 'assets', message: '竹布风筝' }], ['complete', { state: 'done' }]]);
});

test('HTTP 200 business errors reject before reading any SSE content', async () => {
  await assert.rejects(readDramaEventStream(Response.json({ code: 500, msg: '原任务尚未结束' }), () => assert.fail('must not consume')), /原任务尚未结束/);
});

test('malformed event is visible and cannot masquerade as a completed job', () => {
  const parser = createDramaEventParser(() => assert.fail('must not consume'));
  assert.throws(() => parser.push('event: complete\ndata: {broken}\n\n'), /查询原任务/);
});
