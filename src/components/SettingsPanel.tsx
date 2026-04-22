import type { Platform, Settings, Theme } from '../types';
import { PLATFORMS, PLATFORM_LABELS } from '../types';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
}

const THEMES: Theme[] = ['light', 'dark', 'sepia'];

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
          <h3>자동 감지</h3>
          <label className="switch-row">
            <input
              type="checkbox"
              checked={settings.autoDetect}
              onChange={(e) => update('autoDetect', e.target.checked)}
            />
            <span>붙여넣은 텍스트의 플랫폼을 자동으로 추정합니다.</span>
          </label>
          {!settings.autoDetect && (
            <label className="select-group vertical">
              <span className="select-label">기본 플랫폼</span>
              <select
                value={settings.preferredPlatform}
                onChange={(e) => update('preferredPlatform', e.target.value as Platform)}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
          )}
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
            <li><kbd>Cmd/Ctrl</kbd> + <kbd>Enter</kbd> — 클립보드에서 렌더</li>
            <li><kbd>Cmd/Ctrl</kbd> + <kbd>P</kbd> — PDF 내보내기</li>
            <li><kbd>Cmd/Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> — PNG 내보내기</li>
            <li><kbd>Cmd/Ctrl</kbd> + <kbd>S</kbd> — Markdown 저장</li>
            <li><kbd>Cmd/Ctrl</kbd> + <kbd>H</kbd> — 히스토리</li>
            <li><kbd>Cmd/Ctrl</kbd> + <kbd>,</kbd> — 설정</li>
            <li><kbd>Cmd/Ctrl</kbd> + <kbd>1~4</kbd> — 플랫폼 수동 전환</li>
            <li><kbd>Esc</kbd> — 패널 닫기</li>
          </ul>
          <p className="subtle-note">
            데스크탑 버전에서는 전역 단축키(Cmd/Ctrl+Shift+V)로 언제 어디서든 창을 불러올 수 있습니다.
            현재 웹 MVP에서는 창에 포커스가 있어야 작동합니다.
          </p>
        </section>
      </div>
    </aside>
  );
}
