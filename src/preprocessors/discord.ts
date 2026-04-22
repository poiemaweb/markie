import { ensurePipeTableDivider, runCommonPostProcess, transformOutsideFences } from './common';

export function preprocessDiscord(input: string): string {
  let text = runCommonPostProcess(input);

  text = transformOutsideFences(text, (chunk) =>
    chunk.replace(/\|\|([^\n|]+?)\|\|/g, '<span class="spoiler" data-spoiler="1">$1</span>'),
  );

  text = transformOutsideFences(text, (chunk) =>
    chunk.replace(/^-#\s+(.+)$/gm, '<small class="subtext">$1</small>'),
  );

  text = transformOutsideFences(text, (chunk) =>
    chunk.replace(/\\([*_~`|])/g, '$1'),
  );

  text = ensurePipeTableDivider(text);

  return text;
}
