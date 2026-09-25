import type { ReactNode } from 'react';
import { Icon } from './icon';

type AlertTone = 'error' | 'success' | 'info';

const TONES: Record<AlertTone, { classes: string; icon: string }> = {
  error: { classes: 'bg-error-container text-error border-error/30', icon: 'error' },
  success: { classes: 'bg-success-container text-success border-success/30', icon: 'check_circle' },
  info: { classes: 'bg-surface-low text-ink-soft border-hairline', icon: 'info' },
};

export function Alert({ tone = 'info', children }: { tone?: AlertTone; children: ReactNode }) {
  const { classes, icon } = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${classes}`}
    >
      <Icon name={icon} className="mt-px text-[18px]" />
      <div>{children}</div>
    </div>
  );
}
