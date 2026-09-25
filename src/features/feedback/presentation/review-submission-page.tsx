import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { useContainer } from '@/app/context/container-context';
import { useSignedInUser } from '@/features/auth';
import { Alert, Badge, Button, Card, formatDateTime, formatMinutes, Icon, Spinner } from '@/shared/ui';
import type { SubmissionForReview } from '../application/read-models';
import { MAX_COMMENT_LENGTH, MAX_SCORE, MIN_SCORE } from '../domain/feedback';
import { feedbackErrorMessage } from './feedback-error-message';
import { feedbackQueryKeys } from './feedback-query-keys';
import { REVIEW_TASK_LABELS } from './task-type-label';

const feedbackSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, { error: 'Escreva um comentário para o aluno.' })
    .max(MAX_COMMENT_LENGTH, { error: `Use no máximo ${MAX_COMMENT_LENGTH} caracteres.` }),
  score: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), { error: 'Use um número inteiro.' })
    .transform((value) => (value === '' ? null : Number(value)))
    .refine((value) => value === null || (value >= MIN_SCORE && value <= MAX_SCORE), {
      error: `A nota vai de ${MIN_SCORE} a ${MAX_SCORE}.`,
    }),
});

type FeedbackFormInput = z.input<typeof feedbackSchema>;
type FeedbackFormValues = z.output<typeof feedbackSchema>;

export function ReviewSubmissionPage() {
  const { feedback } = useContainer();
  const { submissionId = '' } = useParams();
  const submission = useQuery({
    queryKey: feedbackQueryKeys.review(submissionId),
    queryFn: () => feedback.getForReview.execute(submissionId),
  });

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/revisoes"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        Voltar para correções pendentes
      </Link>
      {submission.isPending ? <Spinner /> : null}
      {submission.isError ? <Alert tone="error">{feedbackErrorMessage(submission.error)}</Alert> : null}
      {submission.data ? <ReviewWorkspace submission={submission.data} /> : null}
    </div>
  );
}

function ReviewWorkspace({ submission }: { submission: SubmissionForReview }) {
  const wordTarget =
    submission.minWords !== null && submission.maxWords !== null
      ? `${submission.minWords}–${submission.maxWords}`
      : null;
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-5 lg:col-span-7">
        <header>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone="primary">{REVIEW_TASK_LABELS[submission.taskType]}</Badge>
            <Badge>Tentativa {submission.attemptNumber}</Badge>
          </div>
          <h1 className="text-4xl text-primary">{submission.exerciseTitle}</h1>
          <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-ink-soft">
            <span>{submission.studentName}</span>
            <span>Enviado em {formatDateTime(submission.createdAt)}</span>
            <span>
              {submission.wordCount} palavras{wordTarget ? ` (meta ${wordTarget})` : ''}
            </span>
            {submission.durationSeconds !== null ? (
              <span>Tempo: {formatMinutes(submission.durationSeconds)}</span>
            ) : null}
          </p>
        </header>
        <Card>
          <h2 className="mb-3 text-2xl text-primary">Texto do aluno</h2>
          <p lang="de" className="rounded-lg bg-inset p-4 leading-[1.75] whitespace-pre-wrap text-ink">
            {submission.content}
          </p>
        </Card>
        <Card tone="inset">
          <h2 className="mb-2 text-xl text-primary">Aufgabe</h2>
          <p className="mb-2 font-serif text-lg text-primary italic">„{submission.prompt}“</p>
          {submission.recipient ? (
            <p className="mb-2 text-sm text-ink-soft">Destinatário: {submission.recipient}</p>
          ) : null}
          <ol className="list-decimal space-y-1 pl-5 text-sm text-ink">
            {submission.guidingPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>
          {submission.guidingPointsChecked !== null ? (
            <p className="mt-2 text-xs text-ink-soft">
              O aluno marcou {submission.guidingPointsChecked} de {submission.guidingPoints.length} Leitpunkte
              como cumpridos.
            </p>
          ) : null}
        </Card>
      </div>
      <div className="lg:sticky lg:top-24 lg:col-span-5">
        {submission.feedback ? (
          <ExistingFeedbackCard submission={submission} />
        ) : (
          <FeedbackForm submissionId={submission.id} />
        )}
      </div>
    </div>
  );
}

function ExistingFeedbackCard({ submission }: { submission: SubmissionForReview }) {
  const { feedback } = submission;
  if (!feedback) return null;
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-2xl text-primary">Correção enviada</h2>
      {feedback.score !== null ? (
        <p className="font-mono text-3xl font-bold text-primary">{feedback.score}/100</p>
      ) : null}
      <p className="text-sm whitespace-pre-wrap">{feedback.comment}</p>
      <p className="text-xs text-ink-soft">Em {formatDateTime(feedback.createdAt)}</p>
    </Card>
  );
}

function FeedbackForm({ submissionId }: { submissionId: string }) {
  const { feedback } = useContainer();
  const teacher = useSignedInUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm<FeedbackFormInput, unknown, FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { comment: '', score: '' },
  });
  const give = useMutation({
    mutationFn: (values: FeedbackFormValues) =>
      feedback.giveFeedback.execute({ submissionId, teacherId: teacher.id, ...values }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: feedbackQueryKeys.pending });
      void navigate('/revisoes');
    },
  });
  const { errors } = form.formState;

  return (
    <Card>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => give.mutate(values))}
        className="flex flex-col gap-4"
      >
        <h2 className="text-2xl text-primary">Sua correção</h2>
        {give.isError ? <Alert tone="error">{feedbackErrorMessage(give.error)}</Alert> : null}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="feedback-score" className="text-sm font-semibold">
            Nota (0–100, opcional)
          </label>
          <input
            id="feedback-score"
            inputMode="numeric"
            aria-invalid={errors.score ? true : undefined}
            aria-describedby={errors.score ? 'feedback-score-error' : undefined}
            className="w-28 rounded-lg border border-hairline bg-surface-lowest px-3 py-2 font-mono text-lg outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/10"
            {...form.register('score')}
          />
          {errors.score ? (
            <p id="feedback-score-error" className="text-sm text-error">
              {errors.score.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="feedback-comment" className="text-sm font-semibold">
            Comentário para o aluno
          </label>
          <textarea
            id="feedback-comment"
            rows={10}
            aria-invalid={errors.comment ? true : undefined}
            aria-describedby={errors.comment ? 'feedback-comment-error' : undefined}
            placeholder="Pontos fortes, o que melhorar em Inhalt, Kohärenz, Wortschatz e Grammatik…"
            className="rounded-lg border border-hairline bg-surface-lowest p-3 text-sm leading-relaxed outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/10"
            {...form.register('comment')}
          />
          {errors.comment ? (
            <p id="feedback-comment-error" className="text-sm text-error">
              {errors.comment.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" size="lg" icon="send" isLoading={give.isPending}>
          Enviar correção
        </Button>
      </form>
    </Card>
  );
}
