import { toPng } from 'html-to-image';

export async function exportPng(previewHost: HTMLElement, filename = 'markdown.png'): Promise<void> {
  // .markdown-body 를 찾아 오프스크린 문서 컨테이너에 복제
  const article = previewHost.querySelector<HTMLElement>('.markdown-body');
  if (!article) throw new Error('렌더링된 콘텐츠를 찾을 수 없습니다');

  // :root CSS 변수를 인라인으로 전달할 wrapper 생성
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const getCssVar = (name: string) => cs.getPropertyValue(name).trim();

  const wrapper = document.createElement('div');
  // 기본 레이아웃 스타일
  wrapper.style.cssText = [
    'position:fixed', 'top:-9999px', 'left:-9999px',
    'width:800px', 'padding:40px 48px 56px',
    `background:${getCssVar('--bg-elevated') || '#ffffff'}`,
    `color:${getCssVar('--fg') || '#1b1f24'}`,
    `font-family:${getCssVar('--font-sans') || 'sans-serif'}`,
    `font-size:calc(15px * ${getCssVar('--font-scale') || '1'})`,
    'line-height:1.75', 'letter-spacing:-0.005em',
    'word-break:keep-all', 'overflow-wrap:anywhere',
  ].join(';');
  // CSS 변수를 wrapper 스코프로 전달
  const cssVars: [string, string][] = [
    ['--bg', getCssVar('--bg')],
    ['--bg-elevated', getCssVar('--bg-elevated')],
    ['--bg-subtle', getCssVar('--bg-subtle')],
    ['--bg-code', getCssVar('--bg-code')],
    ['--fg', getCssVar('--fg')],
    ['--fg-muted', getCssVar('--fg-muted')],
    ['--fg-subtle', getCssVar('--fg-subtle')],
    ['--border', getCssVar('--border')],
    ['--border-strong', getCssVar('--border-strong')],
    ['--accent', getCssVar('--accent')],
    ['--accent-soft', getCssVar('--accent-soft')],
    ['--radius-md', getCssVar('--radius-md')],
    ['--radius-sm', getCssVar('--radius-sm')],
    ['--font-sans', getCssVar('--font-sans')],
    ['--font-mono', getCssVar('--font-mono')],
    ['--font-scale', getCssVar('--font-scale') || '1'],
  ];
  for (const [name, val] of cssVars) {
    if (val) wrapper.style.setProperty(name, val);
  }

  const clone = article.cloneNode(true) as HTMLElement;
  clone.style.maxWidth = '100%';
  clone.style.margin = '0';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const dataUrl = await toPng(wrapper, {
      backgroundColor: getCssVar('--bg-elevated') || '#ffffff',
      pixelRatio: window.devicePixelRatio || 1,
      width: 800,
    });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    triggerDownload(blob, filename);
  } finally {
    document.body.removeChild(wrapper);
  }
}

export function exportMarkdown(text: string, filename = 'note.md'): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, filename);
}

export function exportPdfViaPrint(): void {
  window.print();
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildTimestampedFilename(extension: string, platform: string): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `mdpreview-${platform}-${stamp}.${extension}`;
}
