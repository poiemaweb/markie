import { DEFAULT_SETTINGS, type Settings } from '../types';

const OLD_SETTINGS_KEY = 'mdpreview.settings.v1';
const SETTINGS_KEY = 'markie.settings.v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      const oldRaw = localStorage.getItem(OLD_SETTINGS_KEY);
      if (oldRaw) {
        const oldParsed = JSON.parse(oldRaw) as any;
        const migrated: Settings = {
          theme: oldParsed.theme ?? DEFAULT_SETTINGS.theme,
          fontScale: oldParsed.fontScale ?? DEFAULT_SETTINGS.fontScale,
          historyEnabled: oldParsed.historyEnabled ?? DEFAULT_SETTINGS.historyEnabled,
        };
        saveSettings(migrated);
        localStorage.removeItem(OLD_SETTINGS_KEY);
        return migrated;
      }
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
