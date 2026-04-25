import { useEffect, useRef, useState } from 'react';
import type { Theme } from '../types';
import { Icon } from './Icon';
import { t } from '../i18n';
import markieLogo from '../assets/markie-logo.png';

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

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
const MOD = IS_MAC ? '⌘' : 'Ctrl';

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

  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  return (
    <header className="toolbar" role="toolbar">
      <div className="brand">
        <img src={markieLogo} className="brand-mark" alt="Markie" />
        <span className="brand-name">Markie</span>
      </div>
      <div className="toolbar-group">
        <div className="segmented" role="radiogroup" aria-label={t('settings.theme')}>
          {THEMES.map((themeOpt) => (
            <button
              key={themeOpt.value}
              type="button"
              role="radio"
              aria-checked={theme === themeOpt.value}
              className={theme === themeOpt.value ? 'segment active' : 'segment'}
              onClick={() => onThemeChange(themeOpt.value)}
              title={themeOpt.label}
            >
              <Icon name={themeOpt.icon} size={14} aria-label={themeOpt.label} />
            </button>
          ))}
        </div>
      </div>
      <div className="toolbar-group">
        <button type="button" className="btn primary" onClick={onPaste} title={`${MOD}+Enter`}>
          <Icon name="solar:clipboard-text-bold" size={14} />
          <span>{t('toolbar.importClipboard')}</span>
        </button>
        <button type="button" className="btn" onClick={onToggleSource} style={{ display: 'none' }}>
          <Icon name={showSource ? 'solar:eye-closed-bold' : 'solar:code-bold'} size={14} />
          <span>{showSource ? t('toolbar.hideSource') : t('toolbar.showSource')}</span>
        </button>
      </div>
      <div className="toolbar-group" ref={exportRef} style={{ position: 'relative' }}>
        <button
          type="button"
          className={`btn${exportOpen ? ' active' : ''}`}
          onClick={() => setExportOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={exportOpen}
        >
          <Icon name="solar:download-minimalistic-bold" size={14} />
          <span>{t('toolbar.export')}</span>
          <Icon name={exportOpen ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'} size={12} />
        </button>
        <div className={`export-menu${exportOpen ? ' export-menu--open' : ''}`} role="menu" aria-hidden={!exportOpen}>
          <button
            type="button"
            role="menuitem"
            className="export-menu-item"
            tabIndex={exportOpen ? 0 : -1}
            onClick={() => { onExportPdf(); setExportOpen(false); }}
            title={`${MOD}+P`}
          >
            <Icon name="solar:file-text-bold" size={14} />
            <span>{t('toolbar.exportPdf')}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="export-menu-item"
            tabIndex={exportOpen ? 0 : -1}
            onClick={() => { onExportPng(); setExportOpen(false); }}
            title={`${MOD}+Shift+P`}
          >
            <Icon name="solar:gallery-bold" size={14} />
            <span>{t('toolbar.exportPng')}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="export-menu-item"
            tabIndex={exportOpen ? 0 : -1}
            onClick={() => { onExportMd(); setExportOpen(false); }}
            title={`${MOD}+S`}
          >
            <Icon name="solar:document-text-bold" size={14} />
            <span>{t('toolbar.exportMd')}</span>
          </button>
        </div>
      </div>
      <div className="toolbar-group">
        <button type="button" className="btn ghost" onClick={onOpenHistory} title={`${MOD}+H`}>
          <Icon name="solar:history-bold" size={14} />
          <span>{t('toolbar.history')}</span>
        </button>
        <button type="button" className="btn ghost" onClick={onOpenSettings} title={`${MOD}+,`}>
          <Icon name="solar:settings-bold" size={14} />
          <span>{t('toolbar.settings')}</span>
        </button>
      </div>
    </header>
  );
}
