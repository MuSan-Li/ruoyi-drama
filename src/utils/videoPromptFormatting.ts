export interface VideoPromptParagraph {
  kind: 'heading' | 'body';
  text: string;
}

export interface VideoPromptSpan {
  kind: 'text' | 'quote' | 'reference';
  text: string;
}

const headingPrefix = /^(?:【[^】\n]{1,32}】|\[[^\]\n]{1,32}\]|(?:镜头\s*[\d一二三四五六七八九十]+|第\s*[\d一二三四五六七八九十]+\s*镜)[：:]|(?:画面|动作|表演|摄影|运镜|光色|声音|对白|环境音|结束与承接|约束)[：:])/u;
const pairedQuotes: Record<string, string> = { '“': '”', '「': '」', '『': '』', '‘': '’', '（': '）', '(': ')' };

/** Sentence boundaries outside quotations: dialogue, references and instructions remain verbatim. */
function sentences(text: string): string[] {
  const result: string[] = [];
  const closing: string[] = [];
  let start = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index]!;
    let escapedQuote = false;
    if (character === '"') {
      for (let before = index - 1; before >= 0 && text[before] === '\\'; before--) escapedQuote = !escapedQuote;
    }
    if (character === closing[closing.length - 1] && !escapedQuote) closing.pop();
    else if (pairedQuotes[character]) closing.push(pairedQuotes[character]!);
    else if (character === '"' && !escapedQuote) closing.push('"');
    if (closing.length) continue;
    const fullStop = /[。！？!?]/u.test(character) || (character === '.' && /\s/u.test(text[index + 1] || ''));
    const longClause = /[；;]/u.test(character) && index - start >= 180;
    if (fullStop || longClause) {
      result.push(text.slice(start, index + 1));
      start = index + 1;
    }
  }
  if (start < text.length) result.push(text.slice(start));
  return result;
}

/** Presentation-only line breaks. Never infer sections, reorder content, or rewrite a prompt. */
export function formatVideoPromptText(text = ''): string {
  const paragraphs: string[] = [];
  for (const line of text.replace(/\r\n?/g, '\n').split(/\n+/u)) {
    let content = line.trim();
    if (!content) continue;
    const heading = content.match(headingPrefix)?.[0];
    if (heading) {
      paragraphs.push(heading);
      content = content.slice(heading.length).trim();
    }
    let paragraph = '';
    for (const sentence of sentences(content)) {
      let part = sentence.trim();
      if (!part) continue;
      const nextHeading = part.match(headingPrefix)?.[0];
      if (paragraph && (paragraph.length + part.length > 210 || nextHeading)) {
        paragraphs.push(paragraph);
        paragraph = '';
      }
      if (nextHeading) {
        paragraphs.push(nextHeading);
        part = part.slice(nextHeading.length).trim();
      }
      // Preserve spaces inside English prose, model names, URLs and reference labels.
      paragraph += paragraph ? sentence : part;
    }
    if (paragraph) paragraphs.push(paragraph.trim());
  }
  return paragraphs.join('\n\n');
}

export function videoPromptParagraphs(text = ''): VideoPromptParagraph[] {
  return formatVideoPromptText(text).split(/\n\n/u).filter(Boolean).map(paragraph => ({
    kind: headingPrefix.exec(paragraph)?.[0] === paragraph || /^#{1,6}\s+.{1,60}$/u.test(paragraph) ? 'heading' : 'body',
    text: paragraph,
  }));
}

/** Render escaped text spans, not HTML or an executable Markdown document. */
export function videoPromptSpans(text: string): VideoPromptSpan[] {
  const expression = /“[^”]*”|「[^」]*」|『[^』]*』|"(?:\\.|[^"\\])*"|@(?:image|video|audio)\d+\b/giu;
  const spans: VideoPromptSpan[] = [];
  let offset = 0;
  for (const match of text.matchAll(expression)) {
    if (match.index > offset) spans.push({ kind: 'text', text: text.slice(offset, match.index) });
    spans.push({ kind: match[0].startsWith('@') ? 'reference' : 'quote', text: match[0] });
    offset = match.index + match[0].length;
  }
  if (offset < text.length) spans.push({ kind: 'text', text: text.slice(offset) });
  return spans;
}
