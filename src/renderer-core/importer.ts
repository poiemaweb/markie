import { readClipboardText } from '../tauri-bridge';

/**
 * 붙여넣기/파일 임포트 시 공통으로 적용하는 텍스트 정규화.
 *
 * 동작:
 * 1. CRLF/CR → LF 통일, 앞뒤의 완전 공백 줄 제거
 * 2. 모든 줄의 **공통 leading prefix** 를 우선 제거 (균일 래핑 해소)
 * 3. 남은 leading 공백/탭을 추가로 lstrip. 단 다음 줄은 원본 들여쓰기 보존:
 *    - 펜스 코드 블록(```…``` / ~~~…~~~) 내부
 *    - 중첩 리스트 아이템(`  - item`, `  1. item`)
 *    - **트리 구조 선(박스 드로잉 문자: ├ │ └ ─ ┬ ┴ ┤ ┼ ┌ ┐ ┘ 등)**
 * 4. 연속된 트리 구조 블록을 **자동으로 fenced 코드 블록으로 래핑**.
 *    → 모노스페이스로 렌더링되어 정렬이 유지되고 "소스 그대로" 보인다.
 *
 * 목적: AI/메신저에서 붙여넣은 텍스트의 앞부분 공백을 일괄 정리하면서도
 * 리스트 중첩·코드 펜스·ASCII 트리 시각 계층은 유지한다.
 */
export function normalizeImportedText(raw: string): string {
  const lf = raw.replace(/\r\n?/g, '\n');
  const lines = lf.split('\n');

  // 앞/뒤의 완전 공백 줄 제거
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start++;
  while (end > start && lines[end - 1].trim() === '') end--;
  let body = lines.slice(start, end);
  if (body.length === 0) return '';

  // Pass 1: 공통 leading prefix 제거 (균일 래핑 해소)
  let common: string | null = null;
  for (const line of body) {
    if (line.trim() === '') continue;
    const lead = line.match(/^[\t ]*/)?.[0] ?? '';
    if (common === null) {
      common = lead;
    } else {
      let i = 0;
      while (i < common.length && i < lead.length && common[i] === lead[i]) i++;
      common = common.slice(0, i);
    }
    if (common === '') break;
  }
  if (common && common.length > 0) {
    const prefix = common;
    body = body.map((line) => (line.startsWith(prefix) ? line.slice(prefix.length) : line));
  }

  // Pass 2: 펜스 밖의 잔여 leading 공백 제거 (단, 중첩 리스트/트리 구조 보존)
  const TREE_CHARS = /^[\t ]+[\u2500-\u257F]/; // Box Drawing 블록
  const NESTED_LIST = /^[\t ]+([-*+]|\d+[.)])\s/;
  const isFenceClose = (line: string, marker: string) =>
    new RegExp(`^[ \\t]*${marker}[ \\t]*$`).test(line);

  const out: string[] = [];
  let inFence = false;
  let fenceMarker = '';

  for (const line of body) {
    if (inFence) {
      out.push(line);
      if (isFenceClose(line, fenceMarker)) {
        inFence = false;
        fenceMarker = '';
      }
      continue;
    }
    const fenceOpen = line.match(/^[ \t]*(```+|~~~+)/);
    if (fenceOpen) {
      inFence = true;
      fenceMarker = fenceOpen[1];
      out.push(line.replace(/^[\t ]+/, ''));
      continue;
    }
    if (NESTED_LIST.test(line) || TREE_CHARS.test(line)) {
      out.push(line);
      continue;
    }
    out.push(line.replace(/^[\t ]+/, ''));
  }

  return wrapTreeBlocks(out.join('\n'));
}

/**
 * 연속된 ASCII 트리 구조 블록을 fenced code block 으로 자동 래핑.
 * 이미 fence 안에 있는 구간은 건드리지 않는다.
 * 직전 줄이 "제목성" 문장(콜론/물음표/느낌표·마침표로 끝나지 않는 짧은 줄)이면
 * 트리의 루트로 간주하고 fence 내부에 포함한다.
 */
function wrapTreeBlocks(text: string): string {
  const HAS_TREE = /[\u2500-\u257F]/;
  const FENCE_OPEN = /^[ \t]*(```+|~~~+)/;
  const lines = text.split('\n');
  const out: string[] = [];
  let inFence = false;
  let fenceMarker = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (inFence) {
      out.push(line);
      if (new RegExp(`^[ \\t]*${fenceMarker}[ \\t]*$`).test(line)) {
        inFence = false;
        fenceMarker = '';
      }
      i++;
      continue;
    }
    const openMatch = line.match(FENCE_OPEN);
    if (openMatch) {
      inFence = true;
      fenceMarker = openMatch[1];
      out.push(line);
      i++;
      continue;
    }
    if (!HAS_TREE.test(line)) {
      out.push(line);
      i++;
      continue;
    }
    // 트리 블록 범위 확장 (공백 줄 포함, 후속 fence 앞에서 중단)
    let end = i;
    while (end + 1 < lines.length) {
      const next = lines[end + 1];
      if (FENCE_OPEN.test(next)) break;
      if (HAS_TREE.test(next) || next.trim() === '') {
        end++;
      } else {
        break;
      }
    }
    while (end > i && lines[end].trim() === '') end--;

    // 직전 줄을 루트 제목으로 흡수할지 판단
    let root: string | null = null;
    if (out.length > 0) {
      const prev = out[out.length - 1];
      const trimmed = prev.trim();
      if (
        trimmed !== '' &&
        !/^(?:```+|~~~+)/.test(trimmed) &&
        !/[:?!.。]$/.test(trimmed)
      ) {
        root = out.pop() ?? null;
      }
    }

    out.push('```');
    if (root !== null) out.push(root);
    for (let j = i; j <= end; j++) out.push(lines[j]);
    out.push('```');
    i = end + 1;
  }
  return out.join('\n');
}

/**
 * 클립보드 가져오기 결과
 * - `ok`: 텍스트 획득 성공
 * - `empty`: 클립보드에 텍스트가 없음
 * - `denied`: 권한 거부 또는 브라우저 정책으로 읽기 실패
 */
export type ImportResult =
  | { status: 'ok'; text: string }
  | { status: 'empty' }
  | { status: 'denied'; error: unknown };

/**
 * 버튼 등 명시적 사용자 행동으로 클립보드 텍스트를 가져옵니다.
 * Tauri 데스크톱에서는 네이티브 IPC, 웹에서는 `navigator.clipboard.readText()`를 사용합니다.
 * 웹에서는 브라우저가 Paste 확인 팝업을 띄울 수 있습니다 (브라우저 정책, 비활성화 불가).
 */
export async function importFromClipboard(): Promise<ImportResult> {
  try {
    const raw = await readClipboardText();
    const text = normalizeImportedText(raw);
    if (!text) return { status: 'empty' };
    return { status: 'ok', text };
  } catch (error) {
    return { status: 'denied', error };
  }
}

/**
 * 전역 `paste` 이벤트를 구독합니다.
 * 사용자가 앱 영역(단, textarea/input/contentEditable 제외)에서
 * Cmd/Ctrl+V를 누르면 권한 팝업 없이 즉시 `handler`가 호출됩니다.
 *
 * 반환된 함수를 호출하면 구독을 해제합니다.
 */
export function subscribeGlobalPaste(handler: (text: string) => void): () => void {
  const listener = (e: ClipboardEvent) => {
    if (shouldIgnorePasteTarget(e.target)) return;
    const raw = e.clipboardData?.getData('text/plain') ?? '';
    const text = normalizeImportedText(raw);
    if (!text) return;
    e.preventDefault();
    handler(text);
  };
  window.addEventListener('paste', listener);
  return () => window.removeEventListener('paste', listener);
}

/** 텍스트 입력 컨트롤이 포커스된 상태라면 기본 paste 동작을 유지하기 위해 무시 */
function shouldIgnorePasteTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'TEXTAREA' || tag === 'INPUT' || el.isContentEditable === true;
}
