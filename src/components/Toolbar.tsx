import type { Theme } from '../types';
import { Icon } from './Icon';

interface ToolbarProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onPaste: () => void;
  onExportPdf: () => void;
  onExportPng: () => void;
  onExportMd: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  showSource: boolean;
  onToggleSource: () => void;
}

const THEMES: Array<{ value: Theme; label: string; icon: string }> = [
  { value: 'light', label: 'Light', icon: 'solar:sun-2-bold' },
  { value: 'dark', label: 'Dark', icon: 'solar:moon-bold' },
  { value: 'sepia', label: 'Sepia', icon: 'solar:palette-bold' },
];

export function Toolbar(props: ToolbarProps) {
  const {
    theme,
    onThemeChange,
    onPaste,
    onExportPdf,
    onExportPng,
    onExportMd,
    onOpenHistory,
    onOpenSettings,
    showSource,
    onToggleSource,
  } = props;

  return (
    <header className="toolbar" role="toolbar">
      <div className="brand">
        <Icon name="solar:documents-bold-duotone" size={18} className="brand-mark" aria-label="Markdown Preview" />
        <span className="brand-name">Markdown Preview</span>
        <span className="brand-tag">for messengers</span>
      </div>
      <div className="toolbar-group">
        <div className="segmented" role="radiogroup" aria-label="테마">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={theme === t.value}
              className={theme === t.value ? 'segment active' : 'segment'}
              onClick={() => onThemeChange(t.value)}
              title={t.label}
            >
              <Icon name={t.icon} size={14} aria-label={t.label} />
            </button>
          ))}
        </div>
      </div>
      <div className="toolbar-group">
        <button type="button" className="btn primary" onClick={onPaste} title="Cmd/Ctrl+Enter">
          <Icon name="solar:clipboard-text-bold" size={14} />
          <span>클립보드에서 불러오기</span>
        </button>
        <button type="button" className="btn" onClick={onToggleSource} style={{ display: 'none' }}>
          <Icon name={showSource ? 'solar:eye-closed-bold' : 'solar:code-bold'} size={14} />
          <span>{showSource ? '소스 숨기기' : '원본 보기'}</span>
        </button>
      </div>
      <div className="toolbar-group">
        <button type="button" className="btn" onClick={onExportPdf} title="Cmd/Ctrl+P">
          <Icon name="solar:file-text-bold" size={14} />
          <span>PDF</span>
        </button>
        <button type="button" className="btn" onClick={onExportPng} title="Cmd/Ctrl+Shift+P">
          <Icon name="solar:gallery-bold" size={14} />
          <span>PNG</span>
        </button>
        <button type="button" className="btn" onClick={onExportMd} title="Cmd/Ctrl+S" style={{ display: 'none' }}>
          <Icon name="solar:download-minimalistic-bold" size={14} />
          <span>.md</span>
        </button>
      </div>
      <div className="toolbar-group">
        <button type="button" className="btn ghost" onClick={onOpenHistory} title="Cmd/Ctrl+H">
          <Icon name="solar:history-bold" size={14} />
          <span>히스토리</span>
        </button>
        <button type="button" className="btn ghost" onClick={onOpenSettings} title="Cmd/Ctrl+,">
          <Icon name="solar:settings-bold" size={14} />
          <span>설정</span>
        </button>
      </div>
    </header>
  );
}
