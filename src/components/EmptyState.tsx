import { Icon } from './Icon';
import { t } from '../i18n';

interface EmptyStateProps {
  onPaste: () => void;
}

export function EmptyState({ onPaste }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon name="solar:magic-stick-3-bold-duotone" size={40} className="empty-art" aria-label="Empty state" />
      <h3>{t('emptyState.title')}</h3>
      <p>
        {t('emptyState.description')}
      </p>
      <button type="button" className="btn primary" onClick={onPaste}>
        <Icon name="solar:clipboard-text-bold" size={14} />
        <span>{t('emptyState.importButton')}</span>
      </button>
    </div>
  );
}
