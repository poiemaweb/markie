import { ensurePipeTableDivider, runCommonPostProcess, transformOutsideFences } from './common';

const TELEGRAM_ESCAPED_CHARS = ['\\*', '\\_', '\\[', '\\]', '\\(', '\\)', '\\~', '\\`', '\\>', '\\#', '\\+', '\\-', '\\=', '\\|', '\\{', '\\}', '\\.', '\\!'];

export function preprocessTelegram(input: string): string {
  let text = runCommonPostProcess(input);

  text = transformOutsideFences(text, (chunk) => {
    let out = chunk;
    for (const escaped of TELEGRAM_ESCAPED_CHARS) {
      const char = escaped.charAt(1);
      const re = new RegExp('\\\\\\' + char, 'g');
      out = out.replace(re, char);
    }
    return out;
  });

  text = transformOutsideFences(text, (chunk) =>
    chunk.replace(/__([^_\n]+)__/g, '**$1**'),
  );

  text = ensurePipeTableDivider(text);

  return text;
}
