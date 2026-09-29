import type { ReactNode } from 'react';
import { Icon, PageDecorations } from '@/shared/ui';

interface AuthLayoutProps {
  readonly title: string;
  readonly subtitle: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

/** Centered paper card from the Stitch login screen. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <PageDecorations />
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface-lowest px-6 py-8 shadow-lift sm:px-10">
        <div className="flex flex-col items-center text-center">
          <img
            src="/brand/logo-192.png"
            alt="Zack Zack Akademie für Deutsch lernen"
            className="h-24 w-24 rounded-full shadow-paper"
          />
          <p className="rubric mt-4 inline-flex items-center gap-1 rounded-full bg-surface-low px-3 py-1 text-primary">
            <Icon name="school" className="text-[14px]" />
            Goethe-Zertifikat B2 · Acesso à plataforma
          </p>
          <h1 className="mt-4 text-3xl text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>
        </div>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div> : null}
      </div>
    </main>
  );
}

export function MotivationQuote() {
  return (
    <figure className="mt-6 flex gap-2 rounded-xl bg-surface-low p-4">
      <Icon name="format_quote" className="text-[22px] text-primary-container" />
      <div>
        <blockquote className="font-serif text-lg text-primary italic">„Übung macht den Meister“</blockquote>
        <figcaption className="text-sm text-ink-soft">
          Treine com método e disciplina para conquistar sua pontuação máxima no B2!
        </figcaption>
      </div>
    </figure>
  );
}
