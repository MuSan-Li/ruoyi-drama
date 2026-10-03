import { requireShortDramaEventStream } from './shortDramaResponse.ts';

export type DramaEventConsumer = (event: string, data: Record<string, any>) => void;

/** Shared SSE framing for all three text stages: UTF-8 chunks, CRLF and multi-line data. */
export function createDramaEventParser(consume: DramaEventConsumer) {
  let buffer = '', event = '', data: string[] = [];
  function dispatch() {
    if (data.length) {
      let payload: unknown;
      try { payload = JSON.parse(data.join('\n')); } catch { throw new Error('生成进度内容不完整，请查询原任务状态'); }
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) consume(event || 'message', payload as Record<string, any>);
    }
    event = ''; data = [];
  }
  function line(value: string) {
    if (!value) { dispatch(); return; }
    if (value.startsWith(':')) return;
    const separator = value.indexOf(':');
    const field = separator < 0 ? value : value.slice(0, separator);
    let body = separator < 0 ? '' : value.slice(separator + 1);
    if (body.startsWith(' ')) body = body.slice(1);
    if (field === 'event') event = body;
    if (field === 'data') data.push(body);
  }
  return {
    push(text: string) {
      buffer += text;
      const lines = buffer.split('\n'); buffer = lines.pop() || '';
      for (const value of lines) line(value.endsWith('\r') ? value.slice(0, -1) : value);
    },
    finish() { if (buffer) line(buffer.endsWith('\r') ? buffer.slice(0, -1) : buffer); buffer = ''; dispatch(); },
  };
}

export async function readDramaEventStream(response: Response, consume: DramaEventConsumer) {
  await requireShortDramaEventStream(response);
  const reader = response.body!.getReader(), decoder = new TextDecoder(), parser = createDramaEventParser(consume);
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      parser.push(decoder.decode(chunk.value, { stream: true }));
    }
    parser.push(decoder.decode()); parser.finish();
  } finally { reader.releaseLock(); }
}
