import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { Alert, Badge, Card, formatDateTime, formatMinutes, Icon, Spinner } from '@/shared/ui';
import type { SubmissionDetail } from '../application/read-models';
import { TASK_TYPE_LABELS } from './task-type-labels';
import { writingErrorMessage } from './writing-error-message';
import { writingQueryKeys } from './writing-query-keys';

export function SubmissionDetailPage() {
  const { writing } = useContainer();
  const { submissionId = '' } = useParams();
  const submission = useQuery({
    queryKey: writingQueryKeys.submission(submissionId),
    queryFn: () => writing.getSubmission.execute(submissionId),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/meus-textos"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        Voltar para Meus Textos
      </Link>
      {submission.isPending ? <Spinner /> : null}
      {submission.isError ? <Alert tone="error">{writingErrorMessage(submission.error)}</Alert> : null}
      {submission.data ? <SubmissionDetailView submission={submission.data} /> : null}
    </div>
  );
}

function SubmissionDetailView({ submission }: { submission: SubmissionDetail }) {
  const label = TASK_TYPE_LABELS[submission.taskType];
  const { feedback } = submission;
  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge tone="primary">
            {label.part} · {label.name}
          </Badge>
          <Badge>Tentativa {submission.attemptNumber}</Badge>
        </div>
        <h1 className="text-4xl text-primary">{submission.exerciseTitle}</h1>
        <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-ink-soft">
          <span>Enviado em {formatDateTime(submission.createdAt)}</span>
          <span>{submission.wordCount} palavras</span>
          {submission.durationSeconds !== null ? (
            <span>Tempo: {formatMinutes(submission.durationSeconds)}</span>
          ) : null}
        </p>
      </header>

      <Card className="flex flex-col gap-4 border-l-4 border-l-primary-container">
        <h2 className="text-2xl text-primary">Correção da Melissa</h2>
        {feedback ? (
          <>
            {feedback.score !== null ? (
              <p className="flex items-baseline gap-2">
                <span className="font-mono text-4xl font-bold text-primary">{feedback.score}</span>
                <span className="text-sm text-ink-soft">/ 100</span>
              </p>
            ) : null}
            <p className="text-sm whitespace-pre-wrap text-ink">{feedback.comment}</p>
            <p className="text-xs text-ink-soft">
              Corrigido em {formatDateTime(feedback.createdAt)}
              {feedback.updatedAt ? ` · atualizado em ${formatDateTime(feedback.updatedAt)}` : ''}
            </p>
          </>
        ) : (
          <Alert tone="info">
            Seu texto está na fila de correção. O feedback aparece aqui assim que a Melissa corrigir.
          </Alert>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-2xl text-primary">Seu texto</h2>
        <p lang="de" className="rounded-lg bg-inset p-4 leading-[1.75] whitespace-pre-wrap text-ink">
          {submission.content}
        </p>
      </Card>

      <Card tone="inset">
        <h2 className="mb-2 text-xl text-primary">Aufgabe</h2>
        <p className="mb-3 font-serif text-lg text-primary italic">„{submission.prompt}“</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink">
          {submission.guidingPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
