import { ensurePipeTableDivider, runCommonPostProcess, transformOutsideCodeSpans } from './common';

export function preprocessSlack(input: string): string {
  let text = runCommonPostProcess(input);

  text = transformOutsideCodeSpans(text, (chunk) =>
    chunk.replace(/<(https?:\/\/[^|>\s]+)\|([^>]+)>/g, (_m, url: string, label: string) => {
      const safeLabel = label.replace(/\]/g, '\\]');
      return `[${safeLabel}](${url})`;
    }),
  );

  text = transformOutsideCodeSpans(text, (chunk) =>
    chunk.replace(/<(https?:\/\/[^>\s]+)>/g, (_m, url: string) => url),
  );

  text = transformOutsideCodeSpans(text, (chunk) =>
    chunk.replace(/<(mailto:[^|>\s]+)\|([^>]+)>/g, '[$2]($1)'),
  );

  text = transformOutsideCodeSpans(text, (chunk) =>
    chunk.replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\w)/g, '$1**$2**'),
  );

  text = transformOutsideCodeSpans(text, (chunk) =>
    chunk.replace(/~(?!\s)([^~\n]+?)(?<!\s)~/g, '~~$1~~'),
  );

  text = ensurePipeTableDivider(text);

  return text;
}
