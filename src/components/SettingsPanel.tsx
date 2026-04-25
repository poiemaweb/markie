import type { Settings, Theme } from '../types';
import { t } from '../i18n';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
}

const THEMES: Theme[] = ['light', 'dark', 'sepia'];

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';

interface ShortcutItem {
  keys: string[];
  label: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['Mod', 'Enter'], label: 'shortcutClipboard' },
  { keys: ['Mod', 'P'], label: 'shortcutPdf' },
  { keys: ['Mod', 'Shift', 'P'], label: 'shortcutPng' },
  { keys: ['Mod', 'H'], label: 'shortcutHistory' },
  { keys: ['Mod', ','], label: 'shortcutSettings' },
  { keys: ['Esc'], label: 'shortcutClose' },
];

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <aside className="slide-panel" role="dialog" aria-label={t('settings.title')}>
      <div className="slide-panel-header">
        <h2>{t('settings.title')}</h2>
        <button type="button" className="btn" onClick={onClose}>
          {t('settings.close')}
        </button>
      </div>
      <div className="settings-body">
        <section className="settings-section">
          <h3>{t('settings.theme')}</h3>
          <div className="row-gap">
            {THEMES.map((theme) => (
              <label key={theme} className="radio-pill">
                <input
                  type="radio"
                  name="theme"
                  value={theme}
                  checked={settings.theme === theme}
                  onChange={() => update('theme', theme)}
                />
                <span>{theme}</span>
              </label>
            ))}
          </div>
        </section>
        <section className="settings-section">
          <h3>{t('settings.fontSize')}</h3>
          <div className="slider-row">
            <input
              type="range"
              min={0.8}
              max={1.6}
              step={0.05}
              value={settings.fontScale}
              onChange={(e) => update('fontScale', Number(e.target.value))}
            />
            <span className="slider-value">{Math.round(settings.fontScale * 100)}%</span>
          </div>
        </section>
        <section className="settings-section">
          <h3>{t('settings.history')}</h3>
          <label className="switch-row">
            <input
              type="checkbox"
              checked={settings.historyEnabled}
              onChange={(e) => update('historyEnabled', e.target.checked)}
            />
            <span>{t('settings.historyDescription')}</span>
          </label>
        </section>
        <section className="settings-section">
          <h3>{t('settings.shortcuts')}</h3>
          <ul className="shortcut-list">
            {SHORTCUTS.map(({ keys, label }) => (
              <li key={label}>
                {keys.map((k, i) => (
                  <span key={i}>
                    {i > 0 && ' + '}
                    <kbd>{k === 'Mod' ? MOD_KEY : k}</kbd>
                  </span>
                ))}
                {' — '}
                {t(`settings.${label}`)}
              </li>
            ))}
          </ul>
          <p className="subtle-note">
            {t('settings.shortcutsNote')}
          </p>
        </section>
      </div>
    </aside>
  );
}
