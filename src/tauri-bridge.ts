/**
 * Tauri v2 브릿지.
 * v2에서는 `window.__TAURI__` 글로벌이 기본 노출되지 않으므로
 * `window.__TAURI_INTERNALS__` 존재 여부로 데스크톱 환경을 판별하고,
 * 공식 패키지(`@tauri-apps/api`)의 `invoke`/`listen`을 동적으로 로드합니다.
 * 순수 웹 배포 시에는 동적 import가 실패해도 안전하게 폴백합니다.
 */

export const isTauri = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
};

export async function readClipboardText(): Promise<string> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string>('read_clipboard_text');
    } catch (err) {
      console.warn('Tauri clipboard read failed, falling back to browser', err);
    }
  }
  return navigator.clipboard.readText();
}

export async function onPasteShortcut(handler: () => void): Promise<() => void> {
  if (!isTauri()) return () => {};
  try {
    const { listen } = await import('@tauri-apps/api/event');
    return await listen('mdpreview://paste', () => handler());
  } catch (err) {
    console.warn('Tauri event listener registration failed', err);
    return () => {};
  }
}
