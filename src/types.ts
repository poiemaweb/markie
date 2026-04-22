export type Platform = 'telegram' | 'slack' | 'discord' | 'raw';

export const PLATFORMS: readonly Platform[] = ['telegram', 'slack', 'discord', 'raw'] as const;

export const PLATFORM_LABELS: Record<Platform, string> = {
  telegram: 'Telegram',
  slack: 'Slack',
  discord: 'Discord',
  raw: 'Raw Markdown',
};

export type Theme = 'light' | 'dark' | 'sepia';

export interface PreprocessResult {
  text: string;
  platform: Platform;
  autoDetected: boolean;
  notes: string[];
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  platform: Platform;
  autoDetected: boolean;
  rawText: string;
  preview: string;
}

export interface Settings {
  theme: Theme;
  fontScale: number;
  autoDetect: boolean;
  preferredPlatform: Platform;
  historyEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  fontScale: 1,
  autoDetect: true,
  preferredPlatform: 'raw',
  historyEnabled: true,
};
