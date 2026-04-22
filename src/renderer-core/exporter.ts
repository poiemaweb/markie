import { toPng } from 'html-to-image';

export async function exportPng(previewHost: HTMLElement, filename = 'markdown.png'): Promise<void> {
  // 실제 렌더링된 article 요소를 직접 캡처 (html-to-image는 getComputedStyle로 CSS 변수 해석)
  const article = previewHost.querySelector<HTMLElement>('.markdown-body') ?? previewHost;
  const bgElevated = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-elevated').trim() || '#ffffff';

  const dataUrl = await toPng(article, {
    backgroundColor: bgElevated,
    pixelRatio: window.devicePixelRatio || 1,
    style: { padding: '32px 40px', maxWidth: 'none', margin: '0' },
  });

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  triggerDownload(blob, filename);
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
