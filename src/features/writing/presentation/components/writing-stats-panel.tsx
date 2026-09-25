import { Card, formatDate, Icon } from '@/shared/ui';
import type { StudentWritingStats } from '../../application/use-cases/compute-writing-stats';

function StatTile({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="rounded-xl bg-surface-low p-4">
      <p className="font-serif text-4xl text-primary">
        {value}
        {unit ? <span className="ml-1 font-sans text-sm text-ink-soft">{unit}</span> : null}
      </p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}

const orDash = (value: number | null) => (value === null ? '—' : String(value));

export function WritingStatsPanel({ stats }: { stats: StudentWritingStats }) {
  const averageMinutes =
    stats.averageDurationSeconds === null ? null : Math.max(1, Math.round(stats.averageDurationSeconds / 60));
  return (
    <Card as="aside" aria-labelledby="stats-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="rubric text-secondary">Seu desempenho</p>
          <h2 id="stats-title" className="text-2xl text-primary">
            Resumo do aluno
          </h2>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-high text-primary">
          <Icon name="monitoring" className="text-[20px]" />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatTile value={String(stats.totalSubmissions)} label="Redações enviadas" />
        <StatTile value={orDash(stats.averageWords)} label="Média de palavras por texto" />
        <StatTile
          value={orDash(averageMinutes)}
          unit={averageMinutes === null ? undefined : 'min'}
          label="Tempo médio por treino"
        />
        <StatTile
          value={stats.guidingPointsCoveragePercent === null ? '—' : `${stats.guidingPointsCoveragePercent}%`}
          label="Leitpunkte cumpridos"
        />
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-surface-low p-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-primary-container font-mono text-sm font-bold text-primary">
          {orDash(stats.averageScore)}
        </span>
        <div>
          <p className="text-sm font-semibold text-primary">Nota média da Melissa</p>
          <p className="text-xs text-ink-soft">
            {stats.reviewedSubmissions} de {stats.totalSubmissions} textos corrigidos, pelos 4 critérios do
            Goethe-Institut.
          </p>
        </div>
      </div>
      <p className="flex justify-between border-t border-hairline pt-3 text-xs text-ink-soft">
        <span>Último treino realizado:</span>
        <strong className="text-ink">
          {stats.lastSubmittedAt ? formatDate(stats.lastSubmittedAt) : '—'}
        </strong>
      </p>
    </Card>
  );
}

export function MelissaTip() {
  return (
    <Card tone="inset" as="aside" className="flex flex-col gap-2">
      <p className="flex items-center gap-2 font-serif text-xl text-primary">
        <Icon name="lightbulb" className="text-[22px]" />
        Dica da Melissa
      </p>
      <p className="text-sm text-ink-soft italic">
        Lembre-se: no <strong className="text-ink">Teil 1</strong> você tem cerca de 50 minutos para escrever
        150 a 180 palavras abordando todos os Leitpunkte. No <strong className="text-ink">Teil 2</strong>, o
        tom formal da saudação e da despedida faz toda a diferença para a pontuação em <em>Kohärenz</em>!
      </p>
    </Card>
  );
}
