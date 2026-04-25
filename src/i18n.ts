export type Language = 'ko' | 'en';

export interface Translations {
  app: {
    title: string;
    sampleTitle: string;
    sampleDescription: string;
    sampleImportTitle: string;
    sampleImportMethod1: string;
    sampleImportMethod2: string;
    sampleImportMethod3: string;
    sampleFormatsTitle: string;
    sampleFormatsDescription: string;
    sampleQuote: string;
  };
  toolbar: {
    brandName: string;
    importClipboard: string;
    export: string;
    exportPdf: string;
    exportPng: string;
    exportMd: string;
    history: string;
    settings: string;
    showSource: string;
    hideSource: string;
  };
  input: {
    originalText: string;
    pasteHere: string;
  };
  preview: {
    renderedResult: string;
  };
  statusbar: {
    characters: string;
    clipboardHint: string;
  };
  history: {
    title: string;
    clear: string;
    clearConfirm: string;
    empty: string;
    today: string;
    emptyContent: string;
    delete: string;
  };
  settings: {
    title: string;
    close: string;
    theme: string;
    fontSize: string;
    history: string;
    historyDescription: string;
    shortcuts: string;
    shortcutsNote: string;
    shortcutClipboard: string;
    shortcutPdf: string;
    shortcutPng: string;
    shortcutMd: string;
    shortcutHistory: string;
    shortcutSettings: string;
    shortcutClose: string;
  };
  emptyState: {
    title: string;
    description: string;
    importButton: string;
  };
  notifications: {
    clipboardRendered: string;
    clipboardEmpty: string;
    clipboardDenied: string;
    pdfSaved: string;
    pngSaved: string;
    mdSaved: string;
    renderError: string;
    pdfSaveFailed: string;
    pngSaveFailed: string;
  };
}

export const translations: Record<Language, Translations> = {
  ko: {
    app: {
      title: 'Markie',
      sampleTitle: '# Markie',
      sampleDescription: '마크다운 텍스트를 붙여넣거나 `.md` 파일을 드래그하면 즉시 렌더링됩니다.',
      sampleImportTitle: '## 원본 텍스트 가져오기',
      sampleImportMethod1: '| 클립보드 붙여넣기 | 툴바의 **클립보드에서 불러오기** 버튼 또는 `Cmd+Enter` |',
      sampleImportMethod2: '| 직접 입력 | 왼쪽 원본 텍스트 창에 바로 붙여넣기 |',
      sampleImportMethod3: '| 드래그 & 드롭 | `.md` 파일을 창 위로 드래그해서 놓기 |',
      sampleFormatsTitle: '## 지원 형식',
      sampleFormatsDescription: '제목, **굵게**, *기울임*, `인라인 코드`, 링크, 표, 인용문, 코드 블록을 렌더링합니다.',
      sampleQuote: '> 렌더링 결과는 **PNG** 또는 **PDF**로 저장할 수 있습니다.',
    },
    toolbar: {
      brandName: 'Markie',
      importClipboard: '클립보드에서 불러오기',
      export: '내보내기',
      exportPdf: 'PDF 내보내기',
      exportPng: 'PNG 내보내기',
      exportMd: 'Markdown 저장',
      history: '히스토리',
      settings: '설정',
      showSource: '원본 보기',
      hideSource: '원본 숨기기',
    },
    input: {
      originalText: '원본 텍스트',
      pasteHere: '여기에 붙여넣기',
    },
    preview: {
      renderedResult: '렌더링 결과',
    },
    statusbar: {
      characters: '문자',
      clipboardHint: '클립보드 붙여넣기',
    },
    history: {
      title: '히스토리',
      clear: '모두 삭제',
      clearConfirm: '정말 모든 히스토리를 삭제하시겠습니까?',
      empty: '히스토리가 없습니다',
      today: '오늘',
      emptyContent: '(빈 내용)',
      delete: '삭제',
    },
    settings: {
      title: '설정',
      close: '닫기',
      theme: '테마',
      fontSize: '폰트 크기',
      history: '히스토리',
      historyDescription: '클립보드에서 불러온 내용을 최근 50개까지 저장합니다 (로컬 전용).',
      shortcuts: '단축키',
      shortcutsNote: '데스크탑 앱에서는 전역 단축키로 어느 창에서나 클립보드를 바로 불러올 수 있습니다. 웹에서는 창에 포커스가 있어야 동작합니다.',
      shortcutClipboard: '클립보드에서 렌더',
      shortcutPdf: 'PDF 내보내기',
      shortcutPng: 'PNG 내보내기',
      shortcutMd: 'Markdown 저장',
      shortcutHistory: '히스토리 패널',
      shortcutSettings: '설정 패널',
      shortcutClose: '패널 닫기',
    },
    emptyState: {
      title: '시작하기',
      description: '마크다운 텍스트를 붙여넣거나 `.md` 파일을 드래그하세요',
      importButton: '클립보드에서 불러오기',
    },
    notifications: {
      clipboardRendered: '클립보드 내용을 렌더링했습니다',
      clipboardEmpty: '클립보드가 비어 있습니다',
      clipboardDenied: '직접 붙여넣어 주세요',
      pdfSaved: 'PDF가 저장되었습니다',
      pngSaved: 'PNG가 저장되었습니다',
      mdSaved: 'Markdown 파일이 저장되었습니다',
      renderError: '렌더링 실패',
      pdfSaveFailed: 'PDF 저장 실패',
      pngSaveFailed: 'PNG 저장 실패',
    },
  },
  en: {
    app: {
      title: 'Markie',
      sampleTitle: '# Markie',
      sampleDescription: 'Paste markdown text or drag & drop a `.md` file to render instantly.',
      sampleImportTitle: '## Import Source Text',
      sampleImportMethod1: '| Clipboard Paste | Use **Import from Clipboard** button or `Cmd+Enter` |',
      sampleImportMethod2: '| Direct Input | Paste directly into the source text field |',
      sampleImportMethod3: '| Drag & Drop | Drag a `.md` file onto the window |',
      sampleFormatsTitle: '## Supported Formats',
      sampleFormatsDescription: 'Renders headings, **bold**, *italic*, `inline code`, links, tables, blockquotes, and code blocks.',
      sampleQuote: '> Rendered results can be saved as **PNG** or **PDF**.',
    },
    toolbar: {
      brandName: 'Markie',
      importClipboard: 'Import from Clipboard',
      export: 'Export',
      exportPdf: 'Export PDF',
      exportPng: 'Export PNG',
      exportMd: 'Save Markdown',
      history: 'History',
      settings: 'Settings',
      showSource: 'Show Source',
      hideSource: 'Hide Source',
    },
    input: {
      originalText: 'Source Text',
      pasteHere: 'Paste here',
    },
    preview: {
      renderedResult: 'Rendered Result',
    },
    statusbar: {
      characters: 'characters',
      clipboardHint: 'Paste from clipboard',
    },
    history: {
      title: 'History',
      clear: 'Clear All',
      clearConfirm: 'Are you sure you want to clear all history?',
      empty: 'No history',
      today: 'Today',
      emptyContent: '(empty)',
      delete: 'Delete',
    },
    settings: {
      title: 'Settings',
      close: 'Close',
      theme: 'Theme',
      fontSize: 'Font Size',
      history: 'History',
      historyDescription: 'Save up to 50 recent clipboard imports (local only).',
      shortcuts: 'Keyboard Shortcuts',
      shortcutsNote: 'Desktop app supports global shortcuts to import clipboard from any window. Web requires window focus.',
      shortcutClipboard: 'Render from clipboard',
      shortcutPdf: 'Export PDF',
      shortcutPng: 'Export PNG',
      shortcutMd: 'Save Markdown',
      shortcutHistory: 'History panel',
      shortcutSettings: 'Settings panel',
      shortcutClose: 'Close panel',
    },
    emptyState: {
      title: 'Get Started',
      description: 'Paste markdown text or drag & drop a `.md` file',
      importButton: 'Import from Clipboard',
    },
    notifications: {
      clipboardRendered: 'Clipboard content rendered',
      clipboardEmpty: 'Clipboard is empty',
      clipboardDenied: 'Please paste directly',
      pdfSaved: 'PDF saved',
      pngSaved: 'PNG saved',
      mdSaved: 'Markdown file saved',
      renderError: 'Render failed',
      pdfSaveFailed: 'PDF save failed',
      pngSaveFailed: 'PNG save failed',
    },
  },
};

function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ko')) return 'ko';
  return 'en';
}

let currentLanguage: Language = detectLanguage();

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function t(key: string): string {
  const keys = key.split('.');
  let value: any = translations[currentLanguage];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

export function useTranslation() {
  return { t, language: currentLanguage, setLanguage };
}
