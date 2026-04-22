import { Icon } from './Icon';

interface EmptyStateProps {
  onPaste: () => void;
}

export function EmptyState({ onPaste }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon name="solar:magic-stick-3-bold-duotone" size={40} className="empty-art" aria-label="빈 상태" />
      <h3>렌더할 내용이 없습니다</h3>
      <p>메신저에서 답변을 복사한 뒤 아래 버튼을 누르거나 왼쪽 창에 붙여넣으세요.</p>
      <button type="button" className="btn primary" onClick={onPaste}>
        <Icon name="solar:clipboard-text-bold" size={14} />
        <span>클립보드에서 불러오기</span>
      </button>
    </div>
  );
}
