import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HistoryEntry, Platform, Settings } from './types';
import { PLATFORMS, PLATFORM_LABELS } from './types';
import { detectPlatform, preprocessAuto, preprocessFor } from './preprocessors';
import { renderMarkdown } from './renderer-core/markdown';
import { buildTimestampedFilename, exportMarkdown, exportPdf, exportPng } from './renderer-core/exporter';
import { importFromClipboard, subscribeGlobalPaste } from './renderer-core/importer';
import { appendHistory, clearHistory, loadHistory, removeHistory } from './store/history';
import { loadSettings, saveSettings } from './store/settings';
import { Toolbar } from './components/Toolbar';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { EmptyState } from './components/EmptyState';
import { DownloadFlyout } from './components/DownloadFlyout';
import { onPasteShortcut } from './tauri-bridge';

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';

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
  const [manualPlatform, setManualPlatform] = useState<Platform | 'auto'>('raw');
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [panel, setPanel] = useState<PanelMode>('preview');
  const [showSource, setShowSource] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [downloadAnim, setDownloadAnim] = useState<{ type: 'pdf' | 'png'; key: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const rawInputRef = useRef<HTMLTextAreaElement>(null);
  const dragCounterRef = useRef(0);

  const handleRawScroll = useCallback(() => {
    const src = rawInputRef.current;
    const dst = previewRef.current;
    if (!src || !dst) return;
    const srcMax = src.scrollHeight - src.clientHeight;
    const dstMax = dst.scrollHeight - dst.clientHeight;
    if (srcMax <= 0 || dstMax <= 0) return;
    const ratio = src.scrollTop / srcMax;
    dst.scrollTop = ratio * dstMax;
  }, []);

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

  const downloadAnimTimerRef = useRef<number | null>(null);
  const triggerDownloadAnim = useCallback((type: 'pdf' | 'png') => {
    setDownloadAnim({ type, key: Date.now() });
    if (downloadAnimTimerRef.current !== null) {
      window.clearTimeout(downloadAnimTimerRef.current);
    }
    downloadAnimTimerRef.current = window.setTimeout(() => {
      setDownloadAnim(null);
      downloadAnimTimerRef.current = null;
    }, 950);
  }, []);
  useEffect(() => {
    return () => {
      if (downloadAnimTimerRef.current !== null) {
        window.clearTimeout(downloadAnimTimerRef.current);
      }
    };
  }, []);

  const notify = useCallback((message: string) => {
    setStatus(message);
    const id = window.setTimeout(() => setStatus(''), 2200);
    return () => window.clearTimeout(id);
  }, []);

  const applyPastedText = useCallback(
    (text: string) => {
      setRawText(text);
      setPanel('preview');
      if (settings.historyEnabled) {
        const detected = detectPlatform(text);
        const platform: Platform = detected.score >= 4 ? detected.platform : 'raw';
        setHistory(appendHistory(text, platform, true));
      }
      notify('클립보드 내용을 렌더링했습니다');
    },
    [settings.historyEnabled, notify],
  );

  const pasteFromClipboard = useCallback(async () => {
    const result = await importFromClipboard();
    switch (result.status) {
      case 'ok':
        applyPastedText(result.text);
        return;
      case 'empty':
        notify('클립보드가 비어 있습니다');
        return;
      case 'denied':
        notify(`${MOD_KEY}+V 로 직접 붙여넣어 주세요`);
    }
  }, [applyPastedText, notify]);

  useEffect(() => subscribeGlobalPaste(applyPastedText), [applyPastedText]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const mdFile = files.find((f) => /\.(md|markdown)$/i.test(f.name));
    if (!mdFile) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) applyPastedText(text);
    };
    reader.readAsText(mdFile, 'utf-8');
  }, [applyPastedText]);

  const handleExportPdf = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      await exportPdf(previewRef.current, buildTimestampedFilename('pdf', preprocessed.platform));
      triggerDownloadAnim('pdf');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'PDF 저장 실패');
    }
  }, [notify, triggerDownloadAnim, preprocessed.platform]);

  const handleExportPng = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      await exportPng(previewRef.current, buildTimestampedFilename('png', preprocessed.platform));
      triggerDownloadAnim('png');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'PNG 저장 실패');
    }
  }, [notify, triggerDownloadAnim, preprocessed.platform]);

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
    let cancelled = false;
    let unlisten: (() => void) | undefined;
    void onPasteShortcut(() => {
      void pasteFromClipboard();
    }).then((dispose) => {
      if (cancelled) dispose();
      else unlisten = dispose;
    });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [pasteFromClipboard]);

  return (
    <div
      className="app-root"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drag-overlay" aria-hidden="true">
          <div className="drag-overlay__card">
            <span className="drag-overlay__icon">↓</span>
            <span className="drag-overlay__label">.md 파일을 놓으세요</span>
          </div>
        </div>
      )}
      <Toolbar
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
            ref={rawInputRef}
            className="raw-input"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onScroll={handleRawScroll}
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
        <span className={status ? 'status live' : 'status'}>{status || `${MOD_KEY}+Enter 로 클립보드 붙여넣기`}</span>
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
      {downloadAnim && (
        <DownloadFlyout key={downloadAnim.key} type={downloadAnim.type} />
      )}
    </div>
  );
}
