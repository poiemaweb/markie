import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export async function exportPng(previewHost: HTMLElement, filename = 'markdown.png'): Promise<void> {
  const article = previewHost.querySelector<HTMLElement>('.markdown-body') ?? previewHost;
  const bgElevated = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-elevated').trim() || '#ffffff';

  const pad = 40;
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    `padding:${pad}px`,
    `background:${bgElevated}`,
    'box-sizing:content-box',
    'position:absolute',
    'left:-9999px',
    'top:0',
  ].join(';');

  const parent = article.parentElement!;
  const nextSibling = article.nextSibling;
  wrapper.appendChild(article);
  parent.insertBefore(wrapper, nextSibling);

  await new Promise<void>((r) => requestAnimationFrame(() => { requestAnimationFrame(() => r()); }));

  try {
    const dataUrl = await toPng(wrapper, {
      backgroundColor: bgElevated,
      pixelRatio: window.devicePixelRatio || 1,
      width: wrapper.scrollWidth,
      height: wrapper.scrollHeight,
    });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    triggerDownload(blob, filename);
  } finally {
    parent.insertBefore(article, wrapper);
    parent.removeChild(wrapper);
  }
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

  const article = previewHost.querySelector<HTMLElement>('.markdown-body') ?? previewHost;

  // article 폭을 760px로 고정
  const prevWidth = article.style.width;
  const prevMaxWidth = article.style.maxWidth;
  const prevMargin = article.style.margin;
  article.style.width = `${CONTENT_W}px`;
  article.style.maxWidth = `${CONTENT_W}px`;
  article.style.margin = '0';

  // 실제 DOM에 padding·배경 wrapper를 article 부모로 임시 삽입
  // (clone 아닌 라이브 DOM → 스타일시트 정상 적용)
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    `padding:${pad}px`,
    `background:${bgElevated}`,
    `width:${CONTENT_W + pad * 2}px`,
    'box-sizing:content-box',
    'position:absolute',
    'left:-9999px',
    'top:0',
  ].join(';');

  const parent = article.parentElement!;
  const nextSibling = article.nextSibling;
  wrapper.appendChild(article);
  parent.insertBefore(wrapper, nextSibling);

  // 레이아웃 반영 2프레임 대기
  await new Promise<void>((r) => requestAnimationFrame(() => { requestAnimationFrame(() => r()); }));

  try {
    const canvasW = wrapper.scrollWidth;
    const canvasH = wrapper.scrollHeight;

    const dataUrl = await toPng(wrapper, {
      backgroundColor: bgElevated,
      pixelRatio: 2,
      width: canvasW,
      height: canvasH,
    });

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
    // DOM 원상 복구
    parent.insertBefore(article, wrapper);
    parent.removeChild(wrapper);
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
