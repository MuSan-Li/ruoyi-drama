/** Readable plain screenplay text; formatting never invents actions or durations. */
export function formatScriptText(value?: string): string {
  return (value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/^[ \t]*```[^\n]*$/gm, '')
    .replace(/^[ \t]{0,3}#{1,6}[ \t]*/gm, '')
    .replace(/^[ \t]{0,3}>[ \t]?/gm, '')
    .replace(/^[ \t]*[-+*][ \t]+(?=\S)/gm, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n\n');
}

export function scriptParagraphs(value?: string) {
  return formatScriptText(value).split('\n\n').filter(Boolean).map((text, index) => {
    const scene = /^[一二三四五六七八九十百零〇]+[　 \t]+\S/u.test(text);
    const title = index === 0 && /^《.+》/u.test(text);
    const dialogue = !scene && !title ? text.match(/^([^：:\n]{1,24})[：:][ \t]*(.+)$/u) : null;
    return { text, kind: title ? 'title' : scene ? 'scene' : dialogue ? 'dialogue' : 'action',
      speaker: dialogue?.[1], speech: dialogue?.[2] };
  });
}
