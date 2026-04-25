import type { HistoryEntry } from '../types';

const OLD_HISTORY_KEY = 'mdpreview.history.v1';
const HISTORY_KEY = 'markie.history.v1';
const MAX_ENTRIES = 50;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadHistory(): HistoryEntry[] {
  const existing = localStorage.getItem(HISTORY_KEY);
  if (existing) return safeParse<HistoryEntry[]>(existing, []);
  
  const oldData = localStorage.getItem(OLD_HISTORY_KEY);
  if (oldData) {
    const oldEntries = safeParse<any[]>(oldData, []);
    const migrated: HistoryEntry[] = oldEntries.map(entry => ({
      id: entry.id,
      createdAt: entry.createdAt,
      rawText: entry.rawText,
      preview: entry.preview,
    }));
    saveHistory(migrated);
    localStorage.removeItem(OLD_HISTORY_KEY);
    return migrated;
  }
  return [];
}

export function saveHistory(entries: HistoryEntry[]): void {
  const capped = entries.slice(0, MAX_ENTRIES);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(capped));
}

export function appendHistory(rawText: string): HistoryEntry[] {
  if (!rawText.trim()) return loadHistory();
  const current = loadHistory();
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    rawText,
    preview: rawText.slice(0, 160).replace(/\s+/g, ' '),
  };
  const next = [entry, ...current.filter((e) => e.rawText !== rawText)].slice(0, MAX_ENTRIES);
  saveHistory(next);
  return next;
}

export function removeHistory(id: string): HistoryEntry[] {
  const next = loadHistory().filter((e) => e.id !== id);
  saveHistory(next);
  return next;
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
