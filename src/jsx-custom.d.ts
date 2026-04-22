import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type IconifyIconAttrs = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  icon?: string;
  width?: string | number;
  height?: string | number;
  mode?: 'svg' | 'bg' | 'mask' | 'style';
  inline?: boolean;
  flip?: string;
  rotate?: string | number;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': IconifyIconAttrs;
    }
  }
}

export {};
