import type { ReactNode } from 'react';
import { Icon } from './icon';

type BadgeTone = 'primary' | 'neutral' | 'success' | 'warning';

const TONE_CLASSES: Record<BadgeTone, string> = {
  primary: 'bg-primary-container text-white',
  neutral: 'bg-surface-high text-primary',
  success: 'bg-success-container text-success',
  warning: 'bg-surface-container text-tertiary',
};

interface BadgeProps {
  readonly tone?: BadgeTone;
  readonly icon?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Badge({ tone = 'neutral', icon, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`rubric inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 !text-[10px] ${TONE_CLASSES[tone]} ${className}`}
    >
      {icon ? <Icon name={icon} className="text-[13px]" /> : null}
      {children}
    </span>
  );
}
