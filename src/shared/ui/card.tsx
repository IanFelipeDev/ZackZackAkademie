import type { HTMLAttributes } from 'react';

type CardTone = 'paper' | 'inset';

interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly as?: 'section' | 'article' | 'div' | 'aside';
  readonly tone?: CardTone;
}

const TONE_CLASSES: Record<CardTone, string> = {
  paper: 'bg-surface-lowest border border-hairline shadow-paper',
  inset: 'bg-surface-low/70',
};

export function Card({ as: Tag = 'section', tone = 'paper', className = '', ...rest }: CardProps) {
  return <Tag className={`rounded-xl p-5 sm:p-6 ${TONE_CLASSES[tone]} ${className}`} {...rest} />;
}
