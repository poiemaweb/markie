import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export async function exportPng(previewHost: HTMLElement, filename = 'markdown.png'): Promise<void> {
  // 실제 렌더링된 article 요소를 직접 캡처 (html-to-image는 getComputedStyle로 CSS 변수 해석)
  const article = previewHost.querySelector<HTMLElement>('.markdown-body') ?? previewHost;
  const bgElevated = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-elevated').trim() || '#ffffff';

  const pad = 40; // 상하좌우 여백(px)
  const dataUrl = await toPng(article, {
    backgroundColor: bgElevated,
    pixelRatio: window.devicePixelRatio || 1,
    // 여백만큼 canvas 확장, maxWidth는 건드리지 않아 테이블 잘림 방지
    width: article.scrollWidth + pad * 2,
    height: article.scrollHeight + pad * 2,
    style: { padding: `${pad}px`, boxSizing: 'content-box' },
  });

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  triggerDownload(blob, filename);
}

export function exportMarkdown(text: string, filename = 'note.md'): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, filename);
}

export async function exportPdf(previewHost: HTMLElement, filename = 'markdown.pdf'): Promise<void> {
  const article = previewHost.querySelector<HTMLElement>('.markdown-body') ?? previewHost;
  const bgElevated = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-elevated').trim() || '#ffffff';

  const pad = 40;
  const dataUrl = await toPng(article, {
    backgroundColor: bgElevated,
    pixelRatio: 2, // PDF는 고해상도로 캡처
    width: article.scrollWidth + pad * 2,
    height: article.scrollHeight + pad * 2,
    style: { padding: `${pad}px`, boxSizing: 'content-box' },
  });

  // 이미지 실제 크기(pt 단위) 계산 — A4 폭(595pt)에 맞게 비율 유지
  const imgW = article.scrollWidth + pad * 2;
  const imgH = article.scrollHeight + pad * 2;
  const a4W = 595;
  const scale = a4W / imgW;
  const pdfH = imgH * scale;

  const pdf = new jsPDF({ unit: 'pt', format: [a4W, pdfH], orientation: 'portrait' });
  pdf.addImage(dataUrl, 'PNG', 0, 0, a4W, pdfH);
  pdf.save(filename);
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
