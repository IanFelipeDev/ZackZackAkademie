import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import {
  Alert,
  Badge,
  EmptyState,
  formatClock,
  formatDateTime,
  Icon,
  PageHeader,
  Spinner,
} from '@/shared/ui';
import type { PracticeForAssessment } from '../application/read-models';
import { partLabel } from './speaking-labels';
import { speakingErrorMessage } from './speaking-error-message';
import { speakingQueryKeys } from './speaking-query-keys';

const TAB_PARAM = 'aba';
const ASSESSED_TAB = 'avaliadas';

export function AssessmentQueuePage() {
  const { speaking } = useContainer();
  const [searchParams, setSearchParams] = useSearchParams();
  const showAssessed = searchParams.get(TAB_PARAM) === ASSESSED_TAB;
  const practices = useQuery({
    queryKey: showAssessed ? speakingQueryKeys.assessed : speakingQueryKeys.awaiting,
    queryFn: () =>
      showAssessed ? speaking.listAssessed.execute() : speaking.listAwaitingAssessment.execute(),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Área da professora"
        title="Avaliações orais"
        description="Práticas de Sprechen registradas pelos alunos. Lance a nota depois de ouvir a fala, em aula ou online."
      />
      <div role="tablist" aria-label="Avaliações" className="mb-5 flex gap-2">
        <TabButton isActive={!showAssessed} onClick={() => setSearchParams({})}>
          Aguardando nota
        </TabButton>
        <TabButton isActive={showAssessed} onClick={() => setSearchParams({ [TAB_PARAM]: ASSESSED_TAB })}>
          Avaliadas
        </TabButton>
      </div>
      {practices.isPending ? <Spinner /> : null}
      {practices.isError ? <Alert tone="error">{speakingErrorMessage(practices.error)}</Alert> : null}
      {practices.isSuccess && practices.data.length === 0 ? (
        showAssessed ? (
          <EmptyState icon="history" title="Nenhuma avaliação ainda">
            As práticas avaliadas aparecem aqui.
          </EmptyState>
        ) : (
          <EmptyState icon="task_alt" title="Nada aguardando nota">
            Nenhuma prática de Sprechen esperando avaliação no momento.
          </EmptyState>
        )
      ) : null}
      {practices.isSuccess && practices.data.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {practices.data.map((practice) => (
            <li key={practice.id}>
              <PracticeLink practice={practice} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TabButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        isActive ? 'bg-primary-container text-white' : 'bg-surface-low text-ink-soft hover:text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function PracticeLink({ practice }: { practice: PracticeForAssessment }) {
  const { assessment } = practice;
  return (
    <Link
      to={`/avaliacoes-orais/${practice.id}`}
      className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface-lowest p-4 shadow-paper transition-colors hover:border-primary-container sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <div className="mb-1 flex flex-wrap gap-2">
          <Badge tone="primary">{partLabel(practice.exam, practice.taskType)}</Badge>
          {assessment?.updatedAt ? <Badge icon="edit">Editada</Badge> : null}
        </div>
        <p lang="de" className="font-serif text-xl text-primary">
          {practice.topicTitle}
        </p>
        <p className="text-sm text-ink-soft">
          {practice.studentName} · {formatClock(practice.durationSeconds)} de fala · praticado em{' '}
          {formatDateTime(practice.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {assessment ? (
          <span className="font-mono text-2xl font-bold text-primary">{assessment.score}/100</span>
        ) : null}
        <span className="inline-flex items-center gap-1 text-sm font-semibold whitespace-nowrap text-primary">
          {assessment ? 'Ver avaliação' : 'Avaliar'} <Icon name="arrow_forward" className="text-[18px]" />
        </span>
      </div>
    </Link>
  );
}
