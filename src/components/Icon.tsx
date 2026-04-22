import type { CSSProperties } from 'react';

interface IconProps {
  name: string;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

export function Icon({ name, size = 16, className, style, 'aria-label': ariaLabel }: IconProps) {
  return (
    <iconify-icon
      icon={name}
      width={String(size)}
      height={String(size)}
      className={className}
      style={style}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    />
  );
}
