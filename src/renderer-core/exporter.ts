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
  const rootCs = getComputedStyle(document.documentElement);
  const bgElevated = rootCs.getPropertyValue('--bg-elevated').trim() || '#ffffff';

  const pad = 40;
  const CONTENT_W = 760;
  const canvasW = CONTENT_W + pad * 2;

  const article = previewHost.querySelector<HTMLElement>('.markdown-body') ?? previewHost;

  // 라이브 DOM 요소를 일시적으로 760px로 확장해 캡처 — 스타일시트가 정상 적용됨
  const prevWidth = article.style.width;
  const prevMaxWidth = article.style.maxWidth;
  const prevMargin = article.style.margin;
  article.style.width = `${CONTENT_W}px`;
  article.style.maxWidth = `${CONTENT_W}px`;
  article.style.margin = '0';

  // 레이아웃 반영 대기
  await new Promise<void>((r) => requestAnimationFrame(() => { requestAnimationFrame(() => r()); }));

  try {
    const canvasH = article.scrollHeight + pad * 2;

    const dataUrl = await toPng(article, {
      backgroundColor: bgElevated,
      pixelRatio: 2,
      width: canvasW,
      height: canvasH,
      style: { padding: `${pad}px`, boxSizing: 'content-box' },
    });

    // jsPDF: 테마 배경으로 전체 페이지 채운 뒤 이미지 → 하단 흰 여백 제거
    const a4W = 595;
    const scale = a4W / canvasW;
    const pdfH = canvasH * scale;
    const bgHex = rgbToHex(bgElevated);

    const pdf = new jsPDF({ unit: 'pt', format: [a4W, pdfH], orientation: 'portrait' });
    pdf.setFillColor(bgHex);
    pdf.rect(0, 0, a4W, pdfH, 'F');
    pdf.addImage(dataUrl, 'PNG', 0, 0, a4W, pdfH);
    pdf.save(filename);
  } finally {
    // 원래 스타일 복원
    article.style.width = prevWidth;
    article.style.maxWidth = prevMaxWidth;
    article.style.margin = prevMargin;
  }
}

/** "rgb(r, g, b)" 또는 "#rrggbb" 형태를 jsPDF용 hex 문자열로 변환 */
function rgbToHex(color: string): string {
  const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) {
    return '#' + [m[1], m[2], m[3]]
      .map((n) => parseInt(n).toString(16).padStart(2, '0'))
      .join('');
  }
  return color.startsWith('#') ? color : '#ffffff';
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
