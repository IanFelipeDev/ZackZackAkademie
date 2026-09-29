import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { useContainer } from '@/app/context/container-context';
import { useSignedInUser } from '@/features/auth';
import { Alert, Badge, Button, Card, formatClock, formatDateTime, Icon, Spinner } from '@/shared/ui';
import type { PracticeAssessment, PracticeForAssessment } from '../application/read-models';
import {
  MAX_ASSESSMENT_COMMENT_LENGTH,
  MAX_SPEAKING_SCORE,
  MIN_SPEAKING_SCORE,
} from '../domain/speaking-assessment';
import { SPEAKING_TASK_LABELS } from './speaking-labels';
import { speakingErrorMessage } from './speaking-error-message';
import { speakingQueryKeys } from './speaking-query-keys';

const assessmentSchema = z.object({
  score: z
    .string()
    .trim()
    .regex(/^\d+$/, { error: 'Informe a nota como número inteiro.' })
    .transform(Number)
    .refine((value) => value >= MIN_SPEAKING_SCORE && value <= MAX_SPEAKING_SCORE, {
      error: `A nota vai de ${MIN_SPEAKING_SCORE} a ${MAX_SPEAKING_SCORE}.`,
    }),
  comment: z
    .string()
    .trim()
    .max(MAX_ASSESSMENT_COMMENT_LENGTH, {
      error: `Use no máximo ${MAX_ASSESSMENT_COMMENT_LENGTH} caracteres.`,
    }),
});

type AssessmentFormInput = z.input<typeof assessmentSchema>;
type AssessmentFormValues = z.output<typeof assessmentSchema>;

export function AssessPracticePage() {
  const { speaking } = useContainer();
  const { practiceId = '' } = useParams();
  const practice = useQuery({
    queryKey: speakingQueryKeys.practice(practiceId),
    queryFn: () => speaking.getPracticeForAssessment.execute(practiceId),
  });
  const isAssessed = Boolean(practice.data?.assessment);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to={isAssessed ? '/avaliacoes-orais?aba=avaliadas' : '/avaliacoes-orais'}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        Voltar para as avaliações orais
      </Link>
      {practice.isPending ? <Spinner /> : null}
      {practice.isError ? <Alert tone="error">{speakingErrorMessage(practice.error)}</Alert> : null}
      {practice.data ? <AssessmentWorkspace practice={practice.data} /> : null}
    </div>
  );
}

function AssessmentWorkspace({ practice }: { practice: PracticeForAssessment }) {
  const label = SPEAKING_TASK_LABELS[practice.taskType];
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-5 lg:col-span-7">
        <header>
          <Badge tone="primary" className="mb-2">
            {label.part} · {label.name}
          </Badge>
          <h1 lang="de" className="text-3xl text-primary sm:text-4xl">
            {practice.topicTitle}
          </h1>
          <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-ink-soft">
            <span>{practice.studentName}</span>
            <span>Praticado em {formatDateTime(practice.createdAt)}</span>
            <span>Tempo de fala: {formatClock(practice.durationSeconds)}</span>
          </p>
        </header>
        <Card tone="inset">
          <h2 className="mb-2 text-xl text-primary">Aufgabe</h2>
          <p lang="de" className="mb-3 font-serif text-lg text-primary italic">
            „{practice.prompt}“
          </p>
          <ol lang="de" className="list-decimal space-y-1 pl-5 text-sm text-ink">
            {practice.guidingPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        </Card>
      </div>
      <div className="lg:sticky lg:top-24 lg:col-span-5">
        {practice.assessment ? (
          <AssessedPanel practiceId={practice.id} assessment={practice.assessment} />
        ) : (
          <AssessmentForm practiceId={practice.id} />
        )}
      </div>
    </div>
  );
}

function AssessedPanel({ practiceId, assessment }: { practiceId: string; assessment: PracticeAssessment }) {
  const [isEditing, setIsEditing] = useState(false);
  if (isEditing) {
    return (
      <AssessmentForm practiceId={practiceId} existing={assessment} onDone={() => setIsEditing(false)} />
    );
  }
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-2xl text-primary">Avaliação enviada</h2>
      <p className="font-mono text-3xl font-bold text-primary">{assessment.score}/100</p>
      {assessment.comment ? <p className="text-sm whitespace-pre-wrap">{assessment.comment}</p> : null}
      <p className="text-xs text-ink-soft">
        Por {assessment.teacherName} em {formatDateTime(assessment.createdAt)}
        {assessment.updatedAt ? ` · editada em ${formatDateTime(assessment.updatedAt)}` : ''}
      </p>
      <Button variant="secondary" icon="edit" onClick={() => setIsEditing(true)}>
        Editar avaliação
      </Button>
    </Card>
  );
}

interface AssessmentFormProps {
  readonly practiceId: string;
  /** When given, the form revises this assessment instead of creating one. */
  readonly existing?: PracticeAssessment;
  readonly onDone?: () => void;
}

function AssessmentForm({ practiceId, existing, onDone }: AssessmentFormProps) {
  const { speaking } = useContainer();
  const teacher = useSignedInUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm<AssessmentFormInput, unknown, AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: { score: existing ? String(existing.score) : '', comment: existing?.comment ?? '' },
  });
  const save = useMutation({
    mutationFn: async (values: AssessmentFormValues) => {
      if (existing) await speaking.updateAssessment.execute({ practiceId, ...values });
      else await speaking.assessPractice.execute({ practiceId, teacherId: teacher.id, ...values });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: speakingQueryKeys.all });
      if (existing) onDone?.();
      else void navigate('/avaliacoes-orais');
    },
  });
  const { errors } = form.formState;

  return (
    <Card>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
        className="flex flex-col gap-4"
      >
        <h2 className="text-2xl text-primary">{existing ? 'Editar avaliação' : 'Sua avaliação'}</h2>
        {save.isError ? <Alert tone="error">{speakingErrorMessage(save.error)}</Alert> : null}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assessment-score" className="text-sm font-semibold">
            Nota (0–100)
          </label>
          <input
            id="assessment-score"
            inputMode="numeric"
            aria-invalid={errors.score ? true : undefined}
            aria-describedby={errors.score ? 'assessment-score-error' : undefined}
            className="w-28 rounded-lg border border-hairline bg-surface-lowest px-3 py-2 font-mono text-lg outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/10"
            {...form.register('score')}
          />
          {errors.score ? (
            <p id="assessment-score-error" className="text-sm text-error">
              {errors.score.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assessment-comment" className="text-sm font-semibold">
            Comentário para o aluno (opcional)
          </label>
          <textarea
            id="assessment-comment"
            rows={8}
            aria-invalid={errors.comment ? true : undefined}
            aria-describedby={errors.comment ? 'assessment-comment-error' : undefined}
            placeholder="Aufgabenerfüllung, Flüssigkeit, Aussprache, Wortschatz, Grammatik…"
            className="rounded-lg border border-hairline bg-surface-lowest p-3 text-base leading-relaxed outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/10"
            {...form.register('comment')}
          />
          {errors.comment ? (
            <p id="assessment-comment-error" className="text-sm text-error">
              {errors.comment.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" size="lg" icon={existing ? 'save' : 'send'} isLoading={save.isPending}>
          {existing ? 'Salvar alterações' : 'Enviar avaliação'}
        </Button>
        {existing ? (
          <Button variant="ghost" onClick={onDone} disabled={save.isPending}>
            Cancelar
          </Button>
        ) : null}
      </form>
    </Card>
  );
}
