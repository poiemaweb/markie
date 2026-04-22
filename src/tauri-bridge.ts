type TauriGlobal = {
  invoke?: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
  event?: {
    listen: <T = unknown>(
      name: string,
      handler: (event: { payload: T }) => void,
    ) => Promise<() => void>;
  };
};

function getTauri(): TauriGlobal | undefined {
  if (typeof window === 'undefined') return undefined;
  const g = window as unknown as { __TAURI__?: TauriGlobal };
  return g.__TAURI__;
}

export const isTauri = (): boolean => Boolean(getTauri()?.invoke);

export async function readClipboardText(): Promise<string> {
  const tauri = getTauri();
  if (tauri?.invoke) {
    try {
      return await tauri.invoke<string>('read_clipboard_text');
    } catch (err) {
      console.warn('Tauri clipboard read failed, falling back to browser', err);
    }
  }
  return navigator.clipboard.readText();
}

export async function onPasteShortcut(handler: () => void): Promise<() => void> {
  const tauri = getTauri();
  if (!tauri?.event) return () => {};
  try {
    return await tauri.event.listen('mdpreview://paste', () => handler());
  } catch (err) {
    console.warn('Tauri event listener registration failed', err);
    return () => {};
  }
}
