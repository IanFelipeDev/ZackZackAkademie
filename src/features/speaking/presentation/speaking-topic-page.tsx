import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { useSignedInUser } from '@/features/auth';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  formatClock,
  formatDateTime,
  Icon,
  Spinner,
} from '@/shared/ui';
import type { SpeakingPracticeSummary } from '../application/read-models';
import {
  planDuration,
  stagePlanFor,
  TELC_MINIMUM_REPORT_SECONDS,
  TELC_PREPARATION_PLAN,
} from '../domain/speaking-timer';
import type { SpeakingTopic } from '../domain/speaking-topic';
import { SpeakingChecklist, SpeakingShareTracker } from './components/speaking-practice-tools';
import { SpeakingTimerDialog, type TimerState } from './components/speaking-timer-dialog';
import { TaskCard } from './components/task-card';
import {
  durationLabel,
  partLabel,
  SPEAKING_TASK_LABELS,
  speakingCatalogPath,
  STAGE_LABELS,
} from './speaking-labels';
import { speakingErrorMessage } from './speaking-error-message';
import { speakingQueryKeys } from './speaking-query-keys';

export function SpeakingTopicPage() {
  const { speaking } = useContainer();
  const { topicId = '' } = useParams();
  const topic = useQuery({
    queryKey: speakingQueryKeys.topic(topicId),
    queryFn: () => speaking.getTopic.execute(topicId),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to={topic.data ? speakingCatalogPath(topic.data) : '/sprechen'}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        Voltar para os temas
      </Link>
      {topic.isPending ? <Spinner /> : null}
      {topic.isError ? <Alert tone="error">{speakingErrorMessage(topic.error)}</Alert> : null}
      {topic.data ? <TopicPractice topic={topic.data} /> : null}
    </div>
  );
}

/** telc Teil 1: the structure the student ticks off while reporting. */
const REPORT_STRUCTURE = ['Einleitung', 'Hauptinhalt', 'Persönliches Beispiel', 'Fazit & Fragen'];

/** The practice aids shown in the timer for a topic, if its exam part has any. */
function practiceTools(topic: SpeakingTopic): ((state: TimerState) => ReactNode) | undefined {
  if (topic.exam !== 'telc') return undefined;
  switch (topic.taskType) {
    case 'experience':
      return () => <SpeakingChecklist title="Estrutura do relato" items={REPORT_STRUCTURE} lang="de" />;
    case 'discussion':
      return (state) => <SpeakingShareTracker {...state} />;
    case 'planning':
      return () => <SpeakingChecklist title="Decidam juntos" items={topic.guidingPoints} lang="de" />;
    default:
      return undefined;
  }
}

type OpenTimer = 'preparation' | 'practice' | null;

function TopicPractice({ topic }: { topic: SpeakingTopic }) {
  const { speaking } = useContainer();
  const user = useSignedInUser();
  const queryClient = useQueryClient();
  const [openTimer, setOpenTimer] = useState<OpenTimer>(null);
  const [justRecorded, setJustRecorded] = useState(false);
  const label = SPEAKING_TASK_LABELS[topic.taskType];
  const plan = stagePlanFor(topic.exam, topic.taskType);
  const isTelc = topic.exam === 'telc';

  const history = useQuery({
    queryKey: [...speakingQueryKeys.practices(user.id), topic.id],
    queryFn: () => speaking.listMyPractices.execute(user.id, topic.id),
  });
  const record = useMutation({
    mutationFn: (durationSeconds: number) =>
      speaking.recordPractice.execute({ topicId: topic.id, studentId: user.id, durationSeconds }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: speakingQueryKeys.all });
      setOpenTimer(null);
      setJustRecorded(true);
    },
  });

  function open(timer: Exclude<OpenTimer, null>) {
    record.reset();
    setJustRecorded(false);
    setOpenTimer(timer);
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-5 lg:col-span-7">
        <header>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone="primary" icon={label.icon}>
              {partLabel(topic.exam, topic.taskType)}
            </Badge>
            {history.data && history.data.length > 0 ? (
              <Badge tone="success" icon="check_circle">
                Já praticado
              </Badge>
            ) : (
              <Badge tone="warning" icon="schedule">
                Pendente
              </Badge>
            )}
          </div>
          <h1 lang="de" className="text-3xl text-primary sm:text-4xl">
            {topic.title}
          </h1>
        </header>
        <TaskCard
          exam={topic.exam}
          taskType={topic.taskType}
          prompt={topic.prompt}
          guidingPoints={topic.guidingPoints}
          sourceText={topic.sourceText}
        />
        {topic.followUpQuestions.length > 0 ? (
          <FollowUpQuestions questions={topic.followUpQuestions} />
        ) : null}
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl text-primary">Como praticar</h2>
          <p className="text-sm text-ink-soft">
            Fale em voz alta (sozinho ou com a Melissa) por cerca de {durationLabel(planDuration(plan))}. O
            cronômetro sinaliza cada etapa:
          </p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {plan.map((step) => (
              <li key={step.stage} className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${STAGE_LABELS[step.stage].color}`} aria-hidden />
                <span className="font-semibold">{STAGE_LABELS[step.stage].name}</span>
                <span className="font-mono text-ink-soft">{formatClock(step.seconds)}</span>
              </li>
            ))}
          </ul>
          {justRecorded ? (
            <Alert tone="success">
              Prática registrada! A nota aparece no histórico assim que a Melissa avaliar.
            </Alert>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {isTelc ? (
              <Button variant="secondary" size="lg" icon="edit_note" onClick={() => open('preparation')}>
                Preparação ({durationLabel(planDuration(TELC_PREPARATION_PLAN))})
              </Button>
            ) : null}
            <Button size="lg" icon="timer" onClick={() => open('practice')}>
              Abrir cronômetro
            </Button>
          </div>
        </Card>
      </div>
      <div className="lg:col-span-5">
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl text-primary">Histórico de notas</h2>
          {history.isPending ? <Spinner /> : null}
          {history.isError ? <Alert tone="error">{speakingErrorMessage(history.error)}</Alert> : null}
          {history.isSuccess && history.data.length === 0 ? (
            <EmptyState icon="history" title="Nenhuma prática ainda">
              Use o cronômetro para registrar sua primeira prática deste tema.
            </EmptyState>
          ) : null}
          {history.isSuccess && history.data.length > 0 ? (
            <ul className="flex flex-col divide-y divide-hairline">
              {history.data.map((practice) => (
                <PracticeItem key={practice.id} practice={practice} />
              ))}
            </ul>
          ) : null}
        </Card>
      </div>
      {openTimer === 'preparation' ? (
        <SpeakingTimerDialog
          eyebrow={`${partLabel(topic.exam, topic.taskType)} · Preparação`}
          topicTitle={topic.title}
          plan={TELC_PREPARATION_PLAN}
          finishLabel="Começar a falar"
          canSkip
          onFinish={() => setOpenTimer('practice')}
          onClose={() => setOpenTimer(null)}
        />
      ) : null}
      {openTimer === 'practice' ? (
        <SpeakingTimerDialog
          eyebrow={partLabel(topic.exam, topic.taskType)}
          topicTitle={topic.title}
          plan={plan}
          minimumSeconds={isTelc && topic.taskType === 'experience' ? TELC_MINIMUM_REPORT_SECONDS : undefined}
          tools={practiceTools(topic)}
          isSaving={record.isPending}
          errorMessage={record.isError ? speakingErrorMessage(record.error) : null}
          onFinish={(seconds) => record.mutate(seconds)}
          onClose={() => setOpenTimer(null)}
        />
      ) : null}
    </div>
  );
}

/** telc Teil 1: questions the partner may ask after the report, to rehearse the Nachfragen. */
function FollowUpQuestions({ questions }: { questions: readonly string[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl text-primary">Perguntas para treinar</h2>
        <p className="text-sm text-ink-soft">
          Depois do seu relato, o parceiro faz 1–2 perguntas (Nachfragen). Treine as respostas, ou use-as
          quando for a sua vez de perguntar.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {questions.map((question) => (
          <li
            key={question}
            lang="de"
            className="rounded-lg border border-hairline bg-surface-low p-3 font-serif text-ink"
          >
            {question}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PracticeItem({ practice }: { practice: SpeakingPracticeSummary }) {
  const { assessment } = practice;
  return (
    <li className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-ink-soft">
          {formatDateTime(practice.createdAt)} · {formatClock(practice.durationSeconds)}
        </span>
        {assessment ? (
          <span className="font-mono text-lg font-bold text-primary">{assessment.score}/100</span>
        ) : (
          <Badge tone="warning">Aguardando avaliação</Badge>
        )}
      </div>
      {assessment?.comment ? (
        <p className="text-sm whitespace-pre-wrap text-ink">{assessment.comment}</p>
      ) : null}
      {assessment?.updatedAt ? (
        <p className="text-xs text-ink-soft">Nota atualizada em {formatDateTime(assessment.updatedAt)}</p>
      ) : null}
    </li>
  );
}
