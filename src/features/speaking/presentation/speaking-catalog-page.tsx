import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { useSignedInUser } from '@/features/auth';
import { Alert, Badge, EmptyState, formatDate, Icon, PageHeader, Spinner } from '@/shared/ui';
import type { SpeakingTopicProgress } from '../application/read-models';
import type { SpeakingTaskType } from '../domain/task-type';
import { SpeakingTaskTabs } from './components/speaking-task-tabs';
import { SPEAKING_TASK_LABELS, speakingTaskTypeFromSlug, TOPIC_STATUS_LABELS } from './speaking-labels';
import { speakingErrorMessage } from './speaking-error-message';
import { speakingQueryKeys } from './speaking-query-keys';

const PART_PARAM = 'teil';

export function SpeakingCatalogPage() {
  const { speaking } = useContainer();
  const user = useSignedInUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const taskType = speakingTaskTypeFromSlug(searchParams.get(PART_PARAM));
  const topics = useQuery({
    queryKey: speakingQueryKeys.topics(taskType, user.id),
    queryFn: () => speaking.listTopics.execute(taskType, user.id),
  });

  function selectTaskType(next: SpeakingTaskType) {
    setSearchParams({ [PART_PARAM]: SPEAKING_TASK_LABELS[next].slug });
  }

  const list = topics.data ?? [];
  const practiced = list.filter((t) => t.status === 'practiced').length;

  return (
    <div>
      <PageHeader
        eyebrow="Goethe-Zertifikat B2 · Modul Sprechen"
        title="Expressão Oral"
        description="Escolha um tema, abra o cronômetro e pratique sua fala por etapas: introdução, desenvolvimento e conclusão. Depois a Melissa lança a sua nota."
        actions={<SpeakingTaskTabs value={taskType} onChange={selectTaskType} />}
      />
      {topics.isPending ? <Spinner label="Carregando temas…" /> : null}
      {topics.isError ? <Alert tone="error">{speakingErrorMessage(topics.error)}</Alert> : null}
      {topics.isSuccess && list.length === 0 ? (
        <EmptyState icon="record_voice_over" title="Nenhum tema disponível">
          Os temas desta parte ainda não foram publicados.
        </EmptyState>
      ) : null}
      {list.length > 0 ? (
        <>
          <p className="mb-4 text-sm text-ink-soft">
            {practiced} de {list.length} temas praticados em {SPEAKING_TASK_LABELS[taskType].part}.
          </p>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {list.map((item) => (
              <li key={item.topic.id}>
                <TopicCard item={item} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function TopicCard({ item }: { item: SpeakingTopicProgress }) {
  const { topic } = item;
  const isPracticed = item.status === 'practiced';
  return (
    <Link
      to={`/sprechen/${topic.id}`}
      className="flex h-full flex-col gap-3 rounded-xl border border-hairline bg-surface-lowest p-4 shadow-paper transition-colors hover:border-primary-container"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone={isPracticed ? 'success' : 'warning'} icon={isPracticed ? 'check_circle' : 'schedule'}>
          {TOPIC_STATUS_LABELS[item.status]}
        </Badge>
        {item.lastScore !== null ? (
          <span className="font-mono text-sm font-bold text-primary">Última nota {item.lastScore}/100</span>
        ) : null}
      </div>
      <div>
        <p lang="de" className="font-serif text-xl text-primary">
          {topic.title}
        </p>
        <p lang="de" className="text-sm text-ink-soft italic">
          {topic.prompt}
        </p>
      </div>
      <p className="mt-auto flex items-center justify-between text-xs text-ink-soft">
        <span>
          {item.practiceCount === 0
            ? 'Ainda não praticado'
            : `${item.practiceCount} ${item.practiceCount === 1 ? 'prática' : 'práticas'}${
                item.lastPracticedAt ? ` · última em ${formatDate(item.lastPracticedAt)}` : ''
              }`}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-primary">
          Praticar <Icon name="arrow_forward" className="text-[16px]" />
        </span>
      </p>
    </Link>
  );
}
