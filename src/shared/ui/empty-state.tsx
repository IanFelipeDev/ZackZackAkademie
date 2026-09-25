import type { ReactNode } from 'react';
import { Icon } from './icon';

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-hairline bg-surface-lowest/70 px-6 py-12 text-center">
      <Icon name={icon} className="!text-[40px] text-primary-container/60" />
      <p className="font-serif text-xl text-primary">{title}</p>
      {children ? <div className="max-w-md text-sm text-ink-soft">{children}</div> : null}
    </div>
  );
}
