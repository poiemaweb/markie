export function normalizeLineEndings(input: string): string {
  return input.replace(/\r\n?/g, '\n');
}

export function stripZeroWidth(input: string): string {
  return input.replace(/[\u200B-\u200D\uFEFF]/g, '');
}

export function trimTrailingWhitespace(input: string): string {
  return input
    .split('\n')
    .map((line) => line.replace(/[\t ]+$/g, ''))
    .join('\n');
}

const FENCE_REGEX = /^([\t ]*)(```|~~~)([^\n]*)\n([\s\S]*?)\n\1\2[\t ]*$/gm;

export function transformOutsideFences(
  input: string,
  transform: (segment: string) => string,
): string {
  let out = '';
  let lastIndex = 0;
  FENCE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FENCE_REGEX.exec(input))) {
    const before = input.slice(lastIndex, match.index);
    out += transform(before);
    out += match[0];
    lastIndex = match.index + match[0].length;
  }
  out += transform(input.slice(lastIndex));
  return out;
}

export function transformOutsideCodeSpans(
  input: string,
  transform: (segment: string) => string,
): string {
  return transformOutsideFences(input, (chunk) => {
    let out = '';
    let i = 0;
    while (i < chunk.length) {
      if (chunk[i] === '`') {
        let tickCount = 0;
        while (chunk[i + tickCount] === '`') tickCount++;
        const ticks = '`'.repeat(tickCount);
        const endIdx = chunk.indexOf(ticks, i + tickCount);
        if (endIdx !== -1) {
          out += chunk.slice(i, endIdx + tickCount);
          i = endIdx + tickCount;
          continue;
        }
      }
      let next = chunk.indexOf('`', i);
      if (next === -1) next = chunk.length;
      out += transform(chunk.slice(i, next));
      i = next;
    }
    return out;
  });
}

export function looksLikePipeTable(text: string): boolean {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return false;
  const pipeLines = lines.filter((l) => l.includes('|'));
  if (pipeLines.length < 2) return false;
  const hasDivider = lines.some((l) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(l));
  return hasDivider;
}

export function ensurePipeTableDivider(input: string): string {
  return transformOutsideFences(input, (chunk) => {
    const lines = chunk.split('\n');
    const out: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      out.push(lines[i]);
      const current = lines[i];
      const next = lines[i + 1];
      if (!current || !next) continue;
      const currentPipes = (current.match(/\|/g) ?? []).length;
      const nextIsDivider = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(next);
      if (currentPipes >= 2 && !nextIsDivider) {
        const isSecondPipeRow = (next.match(/\|/g) ?? []).length >= 2;
        const prev = lines[i - 1];
        const prevIsPipeRow = prev ? (prev.match(/\|/g) ?? []).length >= 2 : false;
        if (isSecondPipeRow && !prevIsPipeRow) {
          const columnCount = Math.max(currentPipes - (current.trim().startsWith('|') ? 1 : 0), 1);
          const divider = '|' + Array(columnCount).fill(' --- ').join('|') + '|';
          out.push(divider);
        }
      }
    }
    return out.join('\n');
  });
}

export function runCommonPostProcess(input: string): string {
  let text = normalizeLineEndings(input);
  text = stripZeroWidth(text);
  text = trimTrailingWhitespace(text);
  return text;
}
