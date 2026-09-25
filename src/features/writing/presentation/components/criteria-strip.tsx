const CRITERIA = [
  { name: '1. Inhalt', description: 'Todos os Leitpunkte tratados' },
  { name: '2. Kohärenz', description: 'Conectores e parágrafos' },
  { name: '3. Wortschatz', description: 'Variedade B2 & precisão' },
  { name: '4. Grammatik', description: 'Sintaxe e correção' },
] as const;

/** The four official Goethe B2 Schreiben assessment criteria, as a reminder under the editor. */
export function CriteriaStrip() {
  return (
    <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface-low/50 p-4 sm:grid-cols-4">
      {CRITERIA.map((criterion) => (
        <div key={criterion.name}>
          <dt className="rubric text-secondary">{criterion.name}</dt>
          <dd className="m-0 text-xs text-ink-soft">{criterion.description}</dd>
        </div>
      ))}
    </dl>
  );
}
