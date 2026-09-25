export function AppFooter() {
  return (
    <footer className="mt-16 border-t border-hairline/60 bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-serif text-lg text-primary">Zack Zack Akademie · Goethe-Zertifikat B2</p>
          <p>Preparação atenta, refinada e focada em aprovação · Com a Melissa</p>
        </div>
        <p className="text-xs">
          Temas compilados a partir de modelos de prova reais. Não substitui a avaliação oficial do
          Goethe-Institut.
        </p>
      </div>
    </footer>
  );
}
