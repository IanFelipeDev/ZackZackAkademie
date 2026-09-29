import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import { planDuration, SPEAKING_STAGE_PLANS } from '../domain/speaking-timer';
import type { SpeakingTopic } from '../domain/speaking-topic';
import { SpeakingTimerDialog } from './components/speaking-timer-dialog';
import { SPEAKING_TASK_LABELS, STAGE_LABELS } from './speaking-labels';
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
        to={topic.data ? `/sprechen?teil=${SPEAKING_TASK_LABELS[topic.data.taskType].slug}` : '/sprechen'}
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

function TopicPractice({ topic }: { topic: SpeakingTopic }) {
  const { speaking } = useContainer();
  const user = useSignedInUser();
  const queryClient = useQueryClient();
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [justRecorded, setJustRecorded] = useState(false);
  const label = SPEAKING_TASK_LABELS[topic.taskType];
  const plan = SPEAKING_STAGE_PLANS[topic.taskType];

  const history = useQuery({
    queryKey: [...speakingQueryKeys.practices(user.id), topic.id],
    queryFn: () => speaking.listMyPractices.execute(user.id, topic.id),
  });
  const record = useMutation({
    mutationFn: (durationSeconds: number) =>
      speaking.recordPractice.execute({ topicId: topic.id, studentId: user.id, durationSeconds }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: speakingQueryKeys.all });
      setIsTimerOpen(false);
      setJustRecorded(true);
    },
  });

  function openTimer() {
    record.reset();
    setJustRecorded(false);
    setIsTimerOpen(true);
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-5 lg:col-span-7">
        <header>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone="primary" icon={label.icon}>
              {label.part} · {label.name}
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
        <Card tone="inset">
          <h2 className="mb-2 text-xl text-primary">Aufgabe</h2>
          <p lang="de" className="mb-3 font-serif text-lg text-primary italic">
            „{topic.prompt}“
          </p>
          <ol lang="de" className="list-decimal space-y-1 pl-5 text-sm text-ink">
            {topic.guidingPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl text-primary">Como praticar</h2>
          <p className="text-sm text-ink-soft">
            Fale em voz alta (sozinho ou com a Melissa) por cerca de {Math.round(planDuration(plan) / 60)}{' '}
            minutos. O cronômetro sinaliza cada etapa:
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
          <Button size="lg" icon="timer" onClick={openTimer} className="self-start">
            Abrir cronômetro
          </Button>
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
      {isTimerOpen ? (
        <SpeakingTimerDialog
          taskType={topic.taskType}
          topicTitle={topic.title}
          isSaving={record.isPending}
          errorMessage={record.isError ? speakingErrorMessage(record.error) : null}
          onFinish={(seconds) => record.mutate(seconds)}
          onClose={() => setIsTimerOpen(false)}
        />
      ) : null}
    </div>
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
