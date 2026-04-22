import type { HistoryEntry } from '../types';
import { PLATFORM_LABELS } from '../types';
import { Icon } from './Icon';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onClose: () => void;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (sameDay) return `오늘 ${time}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

export function HistoryPanel({ entries, onClose, onSelect, onDelete, onClear }: HistoryPanelProps) {
  return (
    <aside className="slide-panel" role="dialog" aria-label="히스토리">
      <div className="slide-panel-header">
        <h2>히스토리</h2>
        <div className="row-gap">
          <button type="button" className="btn ghost" onClick={onClear} disabled={entries.length === 0}>
            전체 삭제
          </button>
          <button type="button" className="btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
      {entries.length === 0 ? (
        <div className="empty-inline">아직 저장된 항목이 없습니다.</div>
      ) : (
        <ul className="history-list">
          {entries.map((entry) => (
            <li key={entry.id} className="history-item">
              <button type="button" className="history-main" onClick={() => onSelect(entry)}>
                <div className="history-meta">
                  <span className={`platform-chip chip-${entry.platform}`}>
                    {PLATFORM_LABELS[entry.platform]}
                  </span>
                  <span className="history-time">{formatTime(entry.createdAt)}</span>
                  {entry.autoDetected && <span className="auto-badge">자동</span>}
                </div>
                <div className="history-preview">{entry.preview || '(빈 내용)'}</div>
              </button>
              <button
                type="button"
                className="history-delete"
                aria-label="삭제"
                onClick={() => onDelete(entry.id)}
              >
                <Icon name="solar:close-circle-bold" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
