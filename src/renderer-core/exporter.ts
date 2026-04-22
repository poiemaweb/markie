import { toPng } from 'html-to-image';

export async function exportPng(element: HTMLElement, filename = 'markdown.png'): Promise<void> {
  const computed = getComputedStyle(element);
  const bg = computed.backgroundColor || '#ffffff';

  const dataUrl = await toPng(element, {
    backgroundColor: bg,
    pixelRatio: Math.max(window.devicePixelRatio, 2),
    // overflow:auto로 잘린 콘텐츠 없이 전체 높이 캡처
    height: element.scrollHeight,
    width: element.offsetWidth,
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
