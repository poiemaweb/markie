interface Props {
  type: 'pdf' | 'png';
}

export function DownloadFlyout({ type }: Props) {
  return (
    <div className="dl-flyout" aria-hidden="true">
      <div className={`dl-flyout__card dl-flyout__card--${type}`}>
        <svg className="dl-flyout__file" viewBox="0 0 40 48" fill="none">
          <path
            d="M6 2h20l10 10v34a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
            fill="currentColor"
            opacity="0.9"
          />
          <path d="M26 2v10h10" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" />
        </svg>
        <span className="dl-flyout__label">{type.toUpperCase()}</span>
      </div>
    </div>
  );
}
