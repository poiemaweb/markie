import { readClipboardText } from '../tauri-bridge';

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
    const text = await readClipboardText();
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
    const text = e.clipboardData?.getData('text/plain') ?? '';
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
