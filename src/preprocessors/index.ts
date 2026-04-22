import type { Platform, PreprocessResult } from '../types';
import { detectPlatform } from './detect';
import { preprocessDiscord } from './discord';
import { preprocessRaw } from './raw';
import { preprocessSlack } from './slack';
import { preprocessTelegram } from './telegram';

export { detectPlatform } from './detect';

export function preprocessFor(platform: Platform, input: string): string {
  switch (platform) {
    case 'slack':
      return preprocessSlack(input);
    case 'telegram':
      return preprocessTelegram(input);
    case 'discord':
      return preprocessDiscord(input);
    case 'raw':
      return preprocessRaw(input);
  }
}

export function preprocessAuto(input: string, override?: Platform): PreprocessResult {
  if (override) {
    return {
      text: preprocessFor(override, input),
      platform: override,
      autoDetected: false,
      notes: [`수동 지정: ${override}`],
    };
  }
  const detection = detectPlatform(input);
  const platform: Platform = detection.score >= 4 ? detection.platform : 'raw';
  try {
    return {
      text: preprocessFor(platform, input),
      platform,
      autoDetected: true,
      notes: detection.reasons,
    };
  } catch {
    return {
      text: input,
      platform: 'raw',
      autoDetected: true,
      notes: ['전처리 실패, 원본 반환'],
    };
  }
}
