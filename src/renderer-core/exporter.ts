import { toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';

const EXPORT_WIDTH = 760;

// 동시 export 호출 시 article.style 스냅샷/복원이 서로 덮어써
// 인라인 스타일이 영구히 760px로 고정되는 문제를 막기 위한 직렬화 락
let captureQueue: Promise<unknown> = Promise.resolve();

async function captureArticle(
  previewHost: HTMLElement,
  pixelRatio: number,
): Promise<{ canvas: HTMLCanvasElement; bgElevated: string }> {
  const run = async () => captureArticleLocked(previewHost, pixelRatio);
  const pending = captureQueue.then(run, run);
  captureQueue = pending.catch(() => undefined);
  return pending;
}

async function captureArticleLocked(
  previewHost: HTMLElement,
  pixelRatio: number,
): Promise<{ canvas: HTMLCanvasElement; bgElevated: string }> {
  const article = previewHost.querySelector<HTMLElement>('.markdown-body') ?? previewHost;
  const bgElevated =
    getComputedStyle(document.documentElement).getPropertyValue('--bg-elevated').trim() ||
    '#ffffff';

  // 스크롤 위치 리셋 — html-to-image는 getBoundingClientRect 기준으로 클론을 배치하므로
  // 스크롤된 상태면 article이 뷰포트 밖으로 밀려 캡처가 틀어짐
  const prevScrollTop = previewHost.scrollTop;
  const prevOverflow = previewHost.style.overflow;
  previewHost.scrollTop = 0;
  // overflow:hidden으로 article 너비 변경 시 레이아웃 깜빡임 방지
  previewHost.style.overflow = 'hidden';

  // 창 폭과 무관하게 일정한 너비로 캡처
  const prevWidth = article.style.width;
  const prevMaxWidth = article.style.maxWidth;
  const prevMinWidth = article.style.minWidth;
  article.style.width = `${EXPORT_WIDTH}px`;
  article.style.maxWidth = 'none';
  article.style.minWidth = `${EXPORT_WIDTH}px`;
  await new Promise<void>((r) => requestAnimationFrame(() => { requestAnimationFrame(() => r()); }));

  let srcCanvas: HTMLCanvasElement;
  try {
    srcCanvas = await toCanvas(article, {
      backgroundColor: bgElevated,
      pixelRatio,
    });
  } finally {
    article.style.width = prevWidth;
    article.style.maxWidth = prevMaxWidth;
    article.style.minWidth = prevMinWidth;
    previewHost.style.overflow = prevOverflow;
    previewHost.scrollTop = prevScrollTop;
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
  const pdfH = canvas.height * scale; // 비율 그대로 유지 — 반올림하면 세로 미세 왜곡 발생
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
  // rgb() / rgba() 모두 지원 — rgba의 alpha는 흰 배경 위로 합성해 불투명 hex로 근사
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (m) {
    const a = m[4] === undefined ? 1 : Math.max(0, Math.min(1, parseFloat(m[4])));
    const blend = (c: number) => Math.round(c * a + 255 * (1 - a));
    const rgb = [blend(parseInt(m[1])), blend(parseInt(m[2])), blend(parseInt(m[3]))];
    return '#' + rgb.map((n) => n.toString(16).padStart(2, '0')).join('');
  }
  return color.startsWith('#') ? color : '#ffffff';
}

export function buildTimestampedFilename(extension: string): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `mdpreview-${stamp}.${extension}`;
}
