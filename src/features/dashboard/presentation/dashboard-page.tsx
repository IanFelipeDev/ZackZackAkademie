import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { useSignedInUser } from '@/features/auth';
import type { StudentSpeakingStats } from '@/features/speaking';
import { computeWritingStats, type StudentWritingStats } from '@/features/writing';
import { Alert, Badge, Card, formatDate, formatDateTime, Icon, PageHeader, Spinner } from '@/shared/ui';
import { recentActivity, type ActivityItem } from './recent-activity';

const dashboardQueryKeys = {
  submissions: (studentId: string) => ['dashboard', 'writing', studentId] as const,
  practices: (studentId: string) => ['dashboard', 'speaking', 'practices', studentId] as const,
  speakingStats: (studentId: string) => ['dashboard', 'speaking', 'stats', studentId] as const,
};

const LOAD_ERROR = 'Não foi possível carregar seu desempenho. Tente novamente em instantes.';

export function DashboardPage() {
  const { writing, speaking } = useContainer();
  const user = useSignedInUser();
  const submissions = useQuery({
    queryKey: dashboardQueryKeys.submissions(user.id),
    queryFn: () => writing.listMySubmissions.execute(user.id),
  });
  const practices = useQuery({
    queryKey: dashboardQueryKeys.practices(user.id),
    queryFn: () => speaking.listMyPractices.execute(user.id),
  });
  const speakingStats = useQuery({
    queryKey: dashboardQueryKeys.speakingStats(user.id),
    queryFn: () => speaking.getMyStats.execute(user.id),
  });

  const queries = [submissions, practices, speakingStats];
  const firstName = user.displayName.split(' ')[0] ?? user.displayName;

  return (
    <div>
      <PageHeader
        eyebrow={`Olá, ${firstName}!`}
        title="Painel de desempenho"
        description="Seu progresso nas quatro habilidades do Goethe-Zertifikat B2: Schreiben, Lesen, Hören e Sprechen."
      />
      {queries.some((q) => q.isPending) ? <Spinner label="Carregando seu desempenho…" /> : null}
      {queries.some((q) => q.isError) ? <Alert tone="error">{LOAD_ERROR}</Alert> : null}
      {submissions.data && practices.data && speakingStats.data ? (
        <DashboardContent
          writingStats={computeWritingStats(submissions.data)}
          speakingStats={speakingStats.data}
          activity={recentActivity(submissions.data, practices.data)}
        />
      ) : null}
    </div>
  );
}

interface DashboardContentProps {
  readonly writingStats: StudentWritingStats;
  readonly speakingStats: StudentSpeakingStats;
  readonly activity: readonly ActivityItem[];
}

function DashboardContent({ writingStats, speakingStats, activity }: DashboardContentProps) {
  const awaitingAssessment = speakingStats.totalPractices - speakingStats.assessedPractices;
  return (
    <div className="flex flex-col gap-8">
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <li>
          <SkillCard skill="Schreiben" label="Escrita" icon="edit_note" to="/treino" cta="Treinar Schreiben">
            <Progress
              value={writingStats.reviewedSubmissions}
              max={writingStats.totalSubmissions}
              label={`${writingStats.reviewedSubmissions} de ${writingStats.totalSubmissions} textos corrigidos`}
            />
            <Metrics>
              <Metric label="Textos enviados" value={writingStats.totalSubmissions} />
              <Metric label="Corrigidos" value={writingStats.reviewedSubmissions} />
              <Metric label="Nota média" value={scoreText(writingStats.averageScore)} />
            </Metrics>
            <LastActivity
              at={writingStats.lastSubmittedAt}
              verb="Último texto enviado"
              empty="Nenhum texto enviado ainda."
            />
          </SkillCard>
        </li>
        <li>
          <SkillCard
            skill="Sprechen"
            label="Expressão oral"
            icon="record_voice_over"
            to="/sprechen"
            cta="Treinar Sprechen"
          >
            <Progress
              value={speakingStats.practicedTopics}
              max={speakingStats.totalTopics}
              label={`${speakingStats.practicedTopics} de ${speakingStats.totalTopics} temas praticados`}
            />
            <Metrics>
              <Metric label="Práticas" value={speakingStats.totalPractices} />
              <Metric label="Aguardando nota" value={awaitingAssessment} />
              <Metric label="Nota média" value={scoreText(speakingStats.averageScore)} />
            </Metrics>
            <LastActivity
              at={speakingStats.lastPracticedAt}
              verb="Última prática"
              empty="Nenhuma prática registrada ainda."
            />
          </SkillCard>
        </li>
        <li>
          <ComingSoonCard skill="Lesen" label="Leitura" icon="menu_book">
            Textos com questões no formato da prova de leitura.
          </ComingSoonCard>
        </li>
        <li>
          <ComingSoonCard skill="Hören" label="Audição" icon="headphones">
            Áudios com exercícios de compreensão no formato da prova.
          </ComingSoonCard>
        </li>
      </ul>

      <section aria-labelledby="recent-activity-title">
        <h2 id="recent-activity-title" className="mb-3 text-2xl text-primary">
          Últimas correções e avaliações
        </h2>
        {activity.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Quando a Melissa corrigir um texto ou avaliar uma prática oral, a nota aparece aqui.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {activity.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-lowest px-4 py-3 shadow-paper transition-colors hover:border-primary-container"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2">
                      <Badge tone="primary">{item.skill}</Badge>
                      <span lang="de" className="truncate font-serif text-lg text-primary">
                        {item.title}
                      </span>
                    </span>
                    <span className="text-xs text-ink-soft">{formatDateTime(item.at)}</span>
                  </span>
                  <span className="shrink-0 font-mono text-lg font-bold text-primary">
                    {item.score !== null ? `${item.score}/100` : 'Comentário'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function scoreText(score: number | null): string {
  return score === null ? '—' : `${score}/100`;
}

interface SkillCardProps {
  readonly skill: string;
  readonly label: string;
  readonly icon: string;
  readonly to: string;
  readonly cta: string;
  readonly children: ReactNode;
}

function SkillCard({ skill, label, icon, to, cta, children }: SkillCardProps) {
  return (
    <Card as="article" aria-label={skill} className="flex h-full flex-col gap-4">
      <SkillHeading skill={skill} label={label} icon={icon} />
      {children}
      <Link
        to={to}
        className="mt-auto inline-flex items-center gap-1 self-start text-sm font-semibold text-primary hover:underline"
      >
        {cta} <Icon name="arrow_forward" className="text-[18px]" />
      </Link>
    </Card>
  );
}

function ComingSoonCard({
  skill,
  label,
  icon,
  children,
}: {
  skill: string;
  label: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <Card as="article" tone="inset" aria-label={skill} className="flex h-full flex-col gap-3 opacity-80">
      <div className="flex items-start justify-between gap-2">
        <SkillHeading skill={skill} label={label} icon={icon} muted />
        <Badge icon="schedule">Em breve</Badge>
      </div>
      <p className="text-sm text-ink-soft">{children}</p>
    </Card>
  );
}

function SkillHeading({
  skill,
  label,
  icon,
  muted = false,
}: {
  skill: string;
  label: string;
  icon: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
          muted ? 'bg-surface-high text-outline' : 'bg-primary-container text-white'
        }`}
      >
        <Icon name={icon} />
      </span>
      <div>
        <h2 lang="de" className={`text-2xl leading-tight ${muted ? 'text-ink-soft' : 'text-primary'}`}>
          {skill}
        </h2>
        <p className="rubric text-ink-soft">{label}</p>
      </div>
    </div>
  );
}

function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="h-2.5 overflow-hidden rounded-full bg-surface-highest"
      >
        <div className="h-full rounded-full bg-primary-container" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function Metrics({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-3 gap-2">{children}</dl>;
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-surface-low px-3 py-2">
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="font-mono text-xl font-bold text-primary">{value}</dd>
    </div>
  );
}

function LastActivity({ at, verb, empty }: { at: Date | null; verb: string; empty: string }) {
  return <p className="text-xs text-ink-soft">{at ? `${verb} em ${formatDate(at)}.` : empty}</p>;
}
