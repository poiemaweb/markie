import type { Settings, Theme } from '../types';

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
  { keys: ['Mod', 'Enter'], label: '클립보드에서 렌더' },
  { keys: ['Mod', 'P'], label: 'PDF 내보내기' },
  { keys: ['Mod', 'Shift', 'P'], label: 'PNG 내보내기' },
  { keys: ['Mod', 'H'], label: '히스토리 패널' },
  { keys: ['Mod', ','], label: '설정 패널' },
  { keys: ['Esc'], label: '패널 닫기' },
];

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <aside className="slide-panel" role="dialog" aria-label="설정">
      <div className="slide-panel-header">
        <h2>설정</h2>
        <button type="button" className="btn" onClick={onClose}>
          닫기
        </button>
      </div>
      <div className="settings-body">
        <section className="settings-section">
          <h3>테마</h3>
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
          <h3>폰트 크기</h3>
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
          <h3>히스토리</h3>
          <label className="switch-row">
            <input
              type="checkbox"
              checked={settings.historyEnabled}
              onChange={(e) => update('historyEnabled', e.target.checked)}
            />
            <span>클립보드에서 불러온 내용을 최근 50개까지 저장합니다 (로컬 전용).</span>
          </label>
        </section>
        <section className="settings-section">
          <h3>단축키</h3>
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
                {label}
              </li>
            ))}
          </ul>
          <p className="subtle-note">
            데스크탑 앱에서는 전역 단축키 <kbd>{MOD_KEY}</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> 로
            어느 창에서나 클립보드를 바로 불러올 수 있습니다. 웹에서는 창에 포커스가 있어야 동작합니다.
          </p>
        </section>
      </div>
    </aside>
  );
}
