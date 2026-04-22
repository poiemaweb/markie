import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HistoryEntry, Platform, Settings } from './types';
import { PLATFORMS, PLATFORM_LABELS } from './types';
import { detectPlatform, preprocessAuto, preprocessFor } from './preprocessors';
import { renderMarkdown } from './renderer-core/markdown';
import { buildTimestampedFilename, exportMarkdown, exportPdf, exportPng } from './renderer-core/exporter';
import { appendHistory, clearHistory, loadHistory, removeHistory } from './store/history';
import { loadSettings, saveSettings } from './store/settings';
import { Toolbar } from './components/Toolbar';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { EmptyState } from './components/EmptyState';
import { onPasteShortcut, readClipboardText } from './tauri-bridge';

const SAMPLE_TEXT = [
  '# 🧪 샘플로 체험해보세요',
  '',
  '이 왼쪽에 텔레그램·슬랙·디스코드에서 복사한 답변을 붙여넣거나 **클립보드에서 불러오기** 버튼을 누르세요.',
  '',
  '## 지원 기능',
  '',
  '| 플랫폼 | 굵은 글씨 | 링크 | 테이블 |',
  '| --- | --- | --- | --- |',
  '| Telegram | ✅ | ✅ | ✅ |',
  '| Slack | ✅ | ✅ | ✅ |',
  '| Discord | ✅ | ✅ | ✅ |',
  '',
  '```ts',
  'export const greet = (name: string) => `안녕 ${name}`;',
  '```',
  '',
  '> 원본이 깨져 있어도 전처리 엔진이 포맷을 복원해 렌더합니다.',
].join('\n');

type PanelMode = 'preview' | 'history' | 'settings';

export function App() {
  const [rawText, setRawText] = useState<string>('');
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [manualPlatform, setManualPlatform] = useState<Platform | 'auto'>('auto');
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [panel, setPanel] = useState<PanelMode>('preview');
  const [showSource, setShowSource] = useState(false);
  const [status, setStatus] = useState<string>('');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRawText(SAMPLE_TEXT);
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.setProperty('--font-scale', String(settings.fontScale));
  }, [settings.theme, settings.fontScale]);

  const preprocessed = useMemo(() => {
    if (!rawText) {
      return { text: '', platform: 'raw' as Platform, autoDetected: true, notes: [] };
    }
    const override = manualPlatform === 'auto' ? undefined : manualPlatform;
    if (settings.autoDetect || override) {
      return preprocessAuto(rawText, override);
    }
    return {
      text: preprocessFor(settings.preferredPlatform, rawText),
      platform: settings.preferredPlatform,
      autoDetected: false,
      notes: [`기본값: ${settings.preferredPlatform}`],
    };
  }, [rawText, manualPlatform, settings.autoDetect, settings.preferredPlatform]);

  const detection = useMemo(() => (rawText ? detectPlatform(rawText) : null), [rawText]);

  const html = useMemo(() => {
    if (!preprocessed.text) return '';
    try {
      return renderMarkdown(preprocessed.text);
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      return `<div class="error-banner">렌더링 실패: ${message}</div>`;
    }
  }, [preprocessed.text]);

  const notify = useCallback((message: string) => {
    setStatus(message);
    const id = window.setTimeout(() => setStatus(''), 2200);
    return () => window.clearTimeout(id);
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await readClipboardText();
      if (!text) {
        notify('클립보드가 비어 있습니다');
        return;
      }
      setRawText(text);
      setPanel('preview');
      if (settings.historyEnabled) {
        const detected = detectPlatform(text);
        const platform: Platform = detected.score >= 4 ? detected.platform : 'raw';
        setHistory(appendHistory(text, platform, true));
      }
      notify('클립보드 내용을 렌더링했습니다');
    } catch {
      notify('클립보드 권한이 없습니다. 직접 붙여넣어 주세요');
    }
  }, [settings.historyEnabled, notify]);

  const handleExportPdf = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      await exportPdf(previewRef.current, buildTimestampedFilename('pdf', preprocessed.platform));
      notify('PDF 저장 완료');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'PDF 저장 실패');
    }
  }, [notify, preprocessed.platform]);

  const handleExportPng = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      await exportPng(previewRef.current, buildTimestampedFilename('png', preprocessed.platform));
      notify('PNG 저장 완료');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'PNG 저장 실패');
    }
  }, [notify, preprocessed.platform]);

  const handleExportMd = useCallback(() => {
    if (!preprocessed.text) return;
    exportMarkdown(preprocessed.text, buildTimestampedFilename('md', preprocessed.platform));
    notify('Markdown 저장 완료');
  }, [preprocessed.text, preprocessed.platform, notify]);

  const handleSelectHistory = useCallback((entry: HistoryEntry) => {
    setRawText(entry.rawText);
    setManualPlatform(entry.autoDetected ? 'auto' : entry.platform);
    setPanel('preview');
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory(removeHistory(id));
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 'Enter') {
        e.preventDefault();
        void pasteFromClipboard();
        return;
      }
      if (isMod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        void handleExportPng();
        return;
      }
      if (isMod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleExportPdf();
        return;
      }
      if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleExportMd();
        return;
      }
      if (isMod && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setPanel((p) => (p === 'history' ? 'preview' : 'history'));
        return;
      }
      if (isMod && e.key === ',') {
        e.preventDefault();
        setPanel((p) => (p === 'settings' ? 'preview' : 'settings'));
        return;
      }
      if (isMod && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        const idx = Number(e.key) - 1;
        setManualPlatform(PLATFORMS[idx] ?? 'auto');
        return;
      }
      if (e.key === 'Escape' && panel !== 'preview') {
        e.preventDefault();
        setPanel('preview');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pasteFromClipboard, handleExportMd, handleExportPdf, handleExportPng, panel]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void onPasteShortcut(() => {
      void pasteFromClipboard();
    }).then((dispose) => {
      unlisten = dispose;
    });
    return () => {
      unlisten?.();
    };
  }, [pasteFromClipboard]);

  return (
    <div className="app-root">
      <Toolbar
        platform={preprocessed.platform}
        manualPlatform={manualPlatform}
        onPlatformChange={setManualPlatform}
        theme={settings.theme}
        onThemeChange={(theme) => setSettings((s) => ({ ...s, theme }))}
        onPaste={pasteFromClipboard}
        onExportPdf={handleExportPdf}
        onExportPng={handleExportPng}
        onExportMd={handleExportMd}
        onOpenHistory={() => setPanel(panel === 'history' ? 'preview' : 'history')}
        onOpenSettings={() => setPanel(panel === 'settings' ? 'preview' : 'settings')}
        showSource={showSource}
        onToggleSource={() => setShowSource((v) => !v)}
      />
      <main className="workspace">
        <section className="input-pane" aria-label="입력">
          <label className="pane-heading">
            <span>원본 텍스트</span>
            <span className="hint">여기에 붙여넣기 · {PLATFORM_LABELS[preprocessed.platform]}</span>
          </label>
          <textarea
            className="raw-input"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="텔레그램/슬랙/디스코드 답변을 붙여넣으세요..."
            spellCheck={false}
          />
        </section>
        <section className="preview-pane" aria-label="미리보기">
          <div className="pane-heading">
            <span>렌더링 결과</span>
            <span className="hint">
              {preprocessed.autoDetected ? '자동 감지' : '수동'} ·{' '}
              {preprocessed.notes.length ? preprocessed.notes.join(', ') : '특이 징후 없음'}
            </span>
          </div>
          {html ? (
            <div ref={previewRef} className="preview-host">
              <article
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: html }}
              />
              {showSource && (
                <pre className="source-dump" aria-label="전처리된 소스">
                  {preprocessed.text}
                </pre>
              )}
            </div>
          ) : (
            <EmptyState onPaste={pasteFromClipboard} />
          )}
        </section>
      </main>
      <footer className="statusbar">
        <span>{rawText.length.toLocaleString()} 문자</span>
        <span>감지 후보: {detection ? `${detection.platform} (${detection.score})` : '—'}</span>
        <span className={status ? 'status live' : 'status'}>{status || 'Cmd/Ctrl+Enter 로 클립보드 붙여넣기'}</span>
      </footer>
      {panel === 'history' && (
        <HistoryPanel
          entries={history}
          onClose={() => setPanel('preview')}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          onClear={handleClearHistory}
        />
      )}
      {panel === 'settings' && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setPanel('preview')}
        />
      )}
    </div>
  );
}
