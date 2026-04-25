export type Theme = 'light' | 'dark' | 'sepia';

export interface HistoryEntry {
  id: string;
  createdAt: number;
  rawText: string;
  preview: string;
}

export interface Settings {
  theme: Theme;
  fontScale: number;
  historyEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  fontScale: 1,
  historyEnabled: true,
};
