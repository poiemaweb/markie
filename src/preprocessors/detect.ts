import type { Platform } from '../types';

export interface DetectionSignal {
  platform: Platform;
  score: number;
  reasons: string[];
}

export function detectPlatform(input: string): DetectionSignal {
  const signals: Record<Exclude<Platform, 'raw'>, { score: number; reasons: string[] }> = {
    slack: { score: 0, reasons: [] },
    discord: { score: 0, reasons: [] },
    telegram: { score: 0, reasons: [] },
  };

  const slackLinkCount = (input.match(/<https?:\/\/[^|>\s]+\|[^>]+>/g) ?? []).length;
  if (slackLinkCount > 0) {
    signals.slack.score += 6 + Math.min(slackLinkCount, 4);
    signals.slack.reasons.push(`<URL|label> ${slackLinkCount}개`);
  }

  const spoilerCount = (input.match(/\|\|[^\n|]+\|\|/g) ?? []).length;
  if (spoilerCount > 0) {
    signals.discord.score += 6;
    signals.discord.reasons.push(`스포일러 ${spoilerCount}개`);
  }
  if (/^-#\s/m.test(input)) {
    signals.discord.score += 4;
    signals.discord.reasons.push('Discord subtext');
  }

  const telegramEscapes = (input.match(/\\[*_\[\](){}#+\-=|.!~`>]/g) ?? []).length;
  if (telegramEscapes >= 3) {
    signals.telegram.score += Math.min(telegramEscapes, 8);
    signals.telegram.reasons.push(`MarkdownV2 이스케이프 ${telegramEscapes}개`);
  }

  const singleAsterisk = (input.match(/(^|[^\w*])\*(?!\s)[^*\n]+?(?<!\s)\*(?!\w)/g) ?? []).length;
  const doubleAsterisk = (input.match(/\*\*[^*\n]+\*\*/g) ?? []).length;
  if (singleAsterisk >= 2 && singleAsterisk > doubleAsterisk) {
    signals.slack.score += 2;
    signals.slack.reasons.push('단일 별표 강조 다수');
  }

  let winner: Platform = 'raw';
  let best = 0;
  let reasons: string[] = [];
  for (const [name, signal] of Object.entries(signals) as [Exclude<Platform, 'raw'>, typeof signals['slack']][]) {
    if (signal.score > best) {
      best = signal.score;
      winner = name;
      reasons = signal.reasons;
    }
  }

  return { platform: winner, score: best, reasons };
}
