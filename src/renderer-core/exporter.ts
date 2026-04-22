import { toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';

const EXPORT_WIDTH = 760;

async function captureArticle(
  previewHost: HTMLElement,
  pixelRatio: number,
): Promise<{ canvas: HTMLCanvasElement; bgElevated: string }> {
  const article = previewHost.querySelector<HTMLElement>('.markdown-body') ?? previewHost;
  const bgElevated =
    getComputedStyle(document.documentElement).getPropertyValue('--bg-elevated').trim() ||
    '#ffffff';

  // 창 폭과 무관하게 일정한 너비로 캡처 — scrollWidth가 달라지면 우측 잘림 발생
  const prevWidth = article.style.width;
  const prevMaxWidth = article.style.maxWidth;
  const prevMinWidth = article.style.minWidth;
  article.style.width = `${EXPORT_WIDTH}px`;
  article.style.maxWidth = 'none';
  article.style.minWidth = `${EXPORT_WIDTH}px`;
  await new Promise<void>((r) => requestAnimationFrame(() => { requestAnimationFrame(() => r()); }));

  let srcCanvas: HTMLCanvasElement;
  try {
    // width/height를 명시하지 않으면 html-to-image가 클론 후 직접 측정 — 명시 시 렌더 크기와 미묘하게 달라져 우측 잘림 발생
    srcCanvas = await toCanvas(article, {
      backgroundColor: bgElevated,
      pixelRatio,
    });
  } finally {
    article.style.width = prevWidth;
    article.style.maxWidth = prevMaxWidth;
    article.style.minWidth = prevMinWidth;
  }

  const pad = 40 * pixelRatio;
  const dst = document.createElement('canvas');
  dst.width = srcCanvas.width + pad * 2;
  dst.height = srcCanvas.height + pad * 2;
  const ctx = dst.getContext('2d')!;
  ctx.fillStyle = bgElevated;
  ctx.fillRect(0, 0, dst.width, dst.height);
  ctx.drawImage(srcCanvas, pad, pad);

  return { canvas: dst, bgElevated };
}

export async function exportPng(previewHost: HTMLElement, filename = 'markdown.png'): Promise<void> {
  const dpr = window.devicePixelRatio || 1;
  const { canvas } = await captureArticle(previewHost, dpr);
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('PNG 변환 실패')); return; }
      triggerDownload(blob, filename);
      resolve();
    }, 'image/png');
  });
}

export async function exportPdf(previewHost: HTMLElement, filename = 'markdown.pdf'): Promise<void> {
  // PNG과 동일하게 natural width로 캡처 — forceWidth는 html-to-image가 출력 크기로 오해해 clipping 발생
  const { canvas, bgElevated } = await captureArticle(previewHost, 2);

  // canvas 크기(px) → PDF pt 단위 (A4 폭 595pt 기준)
  const a4W = 595;
  const scale = a4W / canvas.width;
  const pdfH = Math.ceil(canvas.height * scale); // 반올림으로 미세 여백 제거
  const bgHex = resolveColorToHex(bgElevated);

  const pdf = new jsPDF({
    unit: 'pt',
    format: [a4W, pdfH],
    orientation: 'portrait',
    compress: true,
  });
  // 페이지 전체 배경 fill (하단 여백 보장)
  pdf.setFillColor(bgHex);
  pdf.rect(0, 0, a4W, pdfH, 'F');
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, a4W, pdfH, undefined, 'FAST');
  pdf.save(filename);
}

export function exportMarkdown(text: string, filename = 'note.md'): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, filename);
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

/** "rgb(r,g,b)" 또는 "#rrggbb" → jsPDF용 hex */
function resolveColorToHex(color: string): string {
  const m = color.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/);
  if (m) {
    return '#' + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, '0')).join('');
  }
  return color.startsWith('#') ? color : '#ffffff';
}

export function buildTimestampedFilename(extension: string, platform: string): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `mdpreview-${platform}-${stamp}.${extension}`;
}
