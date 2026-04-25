import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ClipboardEvent as ReactClipboardEvent } from 'react';
import type { HistoryEntry, Settings } from './types';
import { renderMarkdown } from './renderer-core/markdown';
import { buildTimestampedFilename, exportMarkdown, exportPdf, exportPng } from './renderer-core/exporter';
import { importFromClipboard, normalizeImportedText, subscribeGlobalPaste } from './renderer-core/importer';
import { appendHistory, clearHistory, loadHistory, removeHistory } from './store/history';
import { loadSettings, saveSettings } from './store/settings';
import { Toolbar } from './components/Toolbar';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { EmptyState } from './components/EmptyState';
import { DownloadFlyout } from './components/DownloadFlyout';
import { onPasteShortcut, onFileDragEnter, onFileDragLeave, onFileDrop, readTextFile, isTauri } from './tauri-bridge';
import { t } from './i18n';

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';

let mermaidIdCounter = 0;
let mermaidInitialized = false;

function getSampleText(): string {
  return [
    t('app.sampleTitle'),
    '',
    t('app.sampleDescription'),
    '',
    t('app.sampleImportTitle'),
    '',
    '| 방법 | 설명 |',
    '| --- | --- |',
    t('app.sampleImportMethod1'),
    t('app.sampleImportMethod2'),
    t('app.sampleImportMethod3'),
    '',
    t('app.sampleFormatsTitle'),
    '',
    t('app.sampleFormatsDescription'),
    '',
    '```ts',
    'export const greet = (name: string) => `안녕 ${name}`;',
    '```',
    '',
    t('app.sampleQuote'),
  ].join('\n');
}

type PanelMode = 'preview' | 'history' | 'settings';

export function App() {
  const [rawText, setRawText] = useState<string>('');
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [panel, setPanel] = useState<PanelMode>('preview');
  const [showSource, setShowSource] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [downloadAnim, setDownloadAnim] = useState<{ type: 'pdf' | 'png' | 'md'; key: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const rawInputRef = useRef<HTMLTextAreaElement>(null);

  const handleRawPaste = useCallback((e: ReactClipboardEvent<HTMLTextAreaElement>) => {
    const raw = e.clipboardData.getData('text/plain');
    if (!raw) return;
    const normalized = normalizeImportedText(raw);
    // 정규화로 변경점이 없으면 브라우저 기본 paste 유지(실행취소 스택 보존)
    if (normalized === raw.replace(/\r\n?/g, '\n')) return;
    e.preventDefault();
    const ta = e.currentTarget;
    const { selectionStart, selectionEnd, value } = ta;
    const next = value.slice(0, selectionStart) + normalized + value.slice(selectionEnd);
    setRawText(next);
    const caret = selectionStart + normalized.length;
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = caret;
    });
  }, []);

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
    setRawText(getSampleText());
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.setProperty('--font-scale', String(settings.fontScale));
  }, [settings.theme, settings.fontScale]);

  const html = useMemo(() => {
    if (!rawText) return '';
    try {
      return renderMarkdown(rawText);
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      return `<div class="error-banner">${t('notifications.renderError')}: ${message}</div>`;
    }
  }, [rawText]);


  // Mermaid: render .mermaid-pending placeholders to SVG after html updates
  useEffect(() => {
    if (!previewRef.current) return;
    const nodes = Array.from(
      previewRef.current.querySelectorAll<HTMLDivElement>('.mermaid-pending'),
    );
    if (!nodes.length) return;

    let cancelled = false;

    import('mermaid').then(({ default: mermaid }) => {
      if (cancelled) return;
      if (!mermaidInitialized) {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
        mermaidInitialized = true;
      }

      void Promise.allSettled(
        nodes.map(async (node) => {
          const code = (node.textContent ?? '').trimEnd();
          const id = `mermaid-diagram-${mermaidIdCounter++}`;
          try {
            const { svg } = await mermaid.render(id, code);
            if (!cancelled) {
              node.innerHTML = svg;
              node.className = 'mermaid-diagram';
            }
          } catch (err) {
            if (!cancelled) {
              node.textContent = `[Mermaid 오류: ${err instanceof Error ? err.message : String(err)}]`;
              node.className = 'mermaid-error';
            }
          }
        }),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [html]);

  const downloadAnimTimerRef = useRef<number | null>(null);
  const triggerDownloadAnim = useCallback((type: 'pdf' | 'png' | 'md') => {
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
        setHistory(appendHistory(text));
      }
      notify(t('notifications.clipboardRendered'));
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
        notify(t('notifications.clipboardEmpty'));
        return;
      case 'denied':
        notify(`${MOD_KEY}+V ${t('notifications.clipboardDenied')}`);
    }
  }, [applyPastedText, notify]);

  useEffect(() => subscribeGlobalPaste(applyPastedText), [applyPastedText]);

  // Tauri: 네이티브 파일 드롭 이벤트 구독
  useEffect(() => {
    if (!isTauri()) return;

    const unlisteners: Array<() => void> = [];
    let cancelled = false;

    Promise.all([
      onFileDragEnter((paths) => {
        if (paths.some((p) => /\.(md|markdown)$/i.test(p))) setIsDragging(true);
      }),
      onFileDragLeave(() => setIsDragging(false)),
      onFileDrop(async (paths) => {
        setIsDragging(false);
        const mdPath = paths.find((p) => /\.(md|markdown)$/i.test(p));
        if (!mdPath) return;
        try {
          const raw = await readTextFile(mdPath);
          const text = normalizeImportedText(raw);
          if (text) applyPastedText(text);
        } catch (err) {
          console.error('파일 읽기 실패', err);
        }
      }),
    ]).then((fns) => {
      if (cancelled) fns.forEach((fn) => fn());
      else unlisteners.push(...fns);
    });

    return () => {
      cancelled = true;
      unlisteners.forEach((fn) => fn());
    };
  }, [applyPastedText]);

  const handleExportPdf = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      await exportPdf(previewRef.current, buildTimestampedFilename('pdf'));
      triggerDownloadAnim('pdf');
    } catch (err) {
      notify(err instanceof Error ? err.message : t('notifications.pdfSaveFailed'));
    }
  }, [notify, triggerDownloadAnim]);

  const handleExportPng = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      await exportPng(previewRef.current, buildTimestampedFilename('png'));
      triggerDownloadAnim('png');
    } catch (err) {
      notify(err instanceof Error ? err.message : t('notifications.pngSaveFailed'));
    }
  }, [notify, triggerDownloadAnim]);

  const handleExportMd = useCallback(() => {
    if (!rawText) return;
    exportMarkdown(rawText, buildTimestampedFilename('md'));
    triggerDownloadAnim('md');
    notify(t('notifications.mdSaved'));
  }, [rawText, triggerDownloadAnim, notify]);

  const handleSelectHistory = useCallback((entry: HistoryEntry) => {
    setRawText(entry.rawText);
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
    <div className="app-root">
      {isDragging && (
        <div className="drag-overlay" aria-hidden="true">
          <div className="drag-overlay__card">
            <span className="drag-overlay__icon">↓</span>
            <span className="drag-overlay__label">{t('emptyState.description')}</span>
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
            <span>{t('input.originalText')}</span>
            <span className="hint">{t('input.pasteHere')}</span>
          </label>
          <textarea
            ref={rawInputRef}
            className="raw-input"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onPaste={handleRawPaste}
            onScroll={handleRawScroll}
            placeholder={t('emptyState.description')}
            spellCheck={false}
          />
        </section>
        <section className="preview-pane" aria-label="미리보기">
          <div className="pane-heading">
            <span>{t('preview.renderedResult')}</span>
          </div>
          {html ? (
            <div ref={previewRef} className="preview-host">
              <article
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: html }}
              />
              {showSource && (
                <pre className="source-dump" aria-label="원본 소스">
                  {rawText}
                </pre>
              )}
            </div>
          ) : (
            <EmptyState onPaste={pasteFromClipboard} />
          )}
        </section>
      </main>
      <footer className="statusbar">
        <span>{rawText.length.toLocaleString()} {t('statusbar.characters')}</span>
        <span className={status ? 'status live' : 'status'}>{status || `${MOD_KEY}+Enter ${t('statusbar.clipboardHint')}`}</span>
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
