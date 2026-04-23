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
import { onPasteShortcut, onFileDragEnter, onFileDragLeave, onFileDrop, readTextFile, isTauri } from './tauri-bridge';

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';

const SAMPLE_TEXT = [
  '# Markdown Preview',
  '',
  '마크다운 텍스트를 붙여넣거나 `.md` 파일을 드래그하면 즉시 렌더링됩니다.',
  '',
  '## 원본 텍스트 가져오기',
  '',
  '| 방법 | 설명 |',
  '| --- | --- |',
  '| 클립보드 붙여넣기 | 툴바의 **클립보드에서 불러오기** 버튼 또는 `Cmd+Enter` |',
  '| 직접 입력 | 왼쪽 원본 텍스트 창에 바로 붙여넣기 |',
  '| 드래그 & 드롭 | `.md` 파일을 창 위로 드래그해서 놓기 |',
  '',
  '## 지원 형식',
  '',
  '제목, **굵게**, *기울임*, `인라인 코드`, 링크, 표, 인용문, 코드 블록을 렌더링합니다.',
  '',
  '```ts',
  'export const greet = (name: string) => `안녕 ${name}`;',
  '```',
  '',
  '> 렌더링 결과는 **PNG** 또는 **PDF**로 저장할 수 있습니다.',
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
      mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

      nodes.forEach(async (node, i) => {
        const code = node.textContent ?? '';
        try {
          const id = `mermaid-${Date.now()}-${i}`;
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
      });
    });

    return () => {
      cancelled = true;
    };
  }, [html]);

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
          const text = await readTextFile(mdPath);
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
    <div className="app-root">
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
            placeholder="마크다운 텍스트를 붙여넣거나 .md 파일을 드래그하세요..."
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
