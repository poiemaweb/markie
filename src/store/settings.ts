import { DEFAULT_SETTINGS, type Settings } from '../types';

const OLD_SETTINGS_KEY = 'mdpreview.settings.v1';
const SETTINGS_KEY = 'markie.settings.v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      const oldRaw = localStorage.getItem(OLD_SETTINGS_KEY);
      if (oldRaw) {
        try {
          const oldParsed = JSON.parse(oldRaw) as unknown;
          const migrated: Settings = {
            theme: (oldParsed as any)?.theme ?? DEFAULT_SETTINGS.theme,
            fontScale: (oldParsed as any)?.fontScale ?? DEFAULT_SETTINGS.fontScale,
            historyEnabled: (oldParsed as any)?.historyEnabled ?? DEFAULT_SETTINGS.historyEnabled,
          };
          saveSettings(migrated);
        } catch {
          // 파싱 실패 시 기본값 사용
        } finally {
          localStorage.removeItem(OLD_SETTINGS_KEY);
        }
        return loadSettings(); // 재귀 호출로 마이그레이션된 값 로드
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
