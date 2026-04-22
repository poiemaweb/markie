import { ensurePipeTableDivider, runCommonPostProcess } from './common';

export function preprocessRaw(input: string): string {
  let text = runCommonPostProcess(input);
  text = ensurePipeTableDivider(text);
  return text;
}
