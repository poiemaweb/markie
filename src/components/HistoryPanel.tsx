import type { HistoryEntry } from '../types';
import { Icon } from './Icon';
import { t } from '../i18n';

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
  if (sameDay) return `${t('history.today')} ${time}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

export function HistoryPanel({ entries, onClose, onSelect, onDelete, onClear }: HistoryPanelProps) {
  return (
    <aside className="slide-panel" role="dialog" aria-label={t('history.title')}>
      <div className="slide-panel-header">
        <h2>{t('history.title')}</h2>
        <div className="row-gap">
          <button type="button" className="btn ghost" onClick={onClear} disabled={entries.length === 0}>
            {t('history.clear')}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            {t('settings.close')}
          </button>
        </div>
      </div>
      {entries.length === 0 ? (
        <div className="empty-inline">{t('history.empty')}</div>
      ) : (
        <ul className="history-list">
          {entries.map((entry) => (
            <li key={entry.id} className="history-item">
              <button type="button" className="history-main" onClick={() => onSelect(entry)}>
                <div className="history-meta">
                  <span className="history-time">{formatTime(entry.createdAt)}</span>
                </div>
                <div className="history-preview">{entry.preview || t('history.emptyContent')}</div>
              </button>
              <button
                type="button"
                className="history-delete"
                aria-label={t('history.delete')}
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
