import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { useSignedInUser } from '@/features/auth';
import { Alert, EmptyState, Icon, Spinner } from '@/shared/ui';
import type { WritingTaskType } from '../domain/task-type';
import type { PhraseGroup } from '../domain/useful-phrase';
import { pickRandomExercise, type WritingExercise } from '../domain/writing-exercise';
import { TaskTypeTabs } from './components/task-type-tabs';
import { WritingSession } from './components/writing-session';
import { TASK_TYPE_LABELS, taskTypeFromSlug } from './task-type-labels';
import { writingErrorMessage } from './writing-error-message';
import { writingQueryKeys } from './writing-query-keys';

const TOPIC_PARAM = 'tema';
const PART_PARAM = 'teil';

export function WritingPracticePage() {
  const { writing } = useContainer();
  const [searchParams, setSearchParams] = useSearchParams();
  const taskType = taskTypeFromSlug(searchParams.get(PART_PARAM));

  const exercises = useQuery({
    queryKey: writingQueryKeys.exercises(taskType),
    queryFn: () => writing.listExercises.execute(taskType),
    staleTime: Infinity,
  });
  const phrases = useQuery({
    queryKey: writingQueryKeys.phrases(taskType),
    queryFn: () => writing.listUsefulPhrases.execute(taskType),
    staleTime: Infinity,
  });

  function selectTaskType(next: WritingTaskType) {
    setSearchParams({ [PART_PARAM]: TASK_TYPE_LABELS[next].slug });
  }

  function selectExercise(exerciseId: string) {
    setSearchParams({ [PART_PARAM]: TASK_TYPE_LABELS[taskType].slug, [TOPIC_PARAM]: exerciseId });
  }

  const list = exercises.data ?? [];
  const selected = list.find((e) => e.id === searchParams.get(TOPIC_PARAM)) ?? list[0];

  function selectRandomExercise() {
    const others = list.filter((e) => e.id !== selected?.id);
    const next = pickRandomExercise(others.length > 0 ? others : list);
    if (next) selectExercise(next.id);
  }

  return (
    <div>
      <PracticeHero>
        <TaskTypeTabs value={taskType} onChange={selectTaskType} />
      </PracticeHero>

      {exercises.isError || phrases.isError ? (
        <Alert tone="error">{writingErrorMessage(exercises.error ?? phrases.error)}</Alert>
      ) : null}
      {exercises.isPending || phrases.isPending ? <Spinner label="Carregando temas…" /> : null}
      {exercises.isSuccess && !selected ? (
        <EmptyState icon="menu_book" title="Nenhum tema disponível">
          Os temas desta parte ainda não foram publicados.
        </EmptyState>
      ) : null}
      {selected && phrases.data ? (
        <DraftLoader
          key={selected.id}
          exercise={selected}
          exercises={list}
          phraseGroups={phrases.data}
          onSelectExercise={selectExercise}
          onRandomExercise={selectRandomExercise}
        />
      ) : null}
    </div>
  );
}

function PracticeHero({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mb-8 flex max-w-3xl flex-col items-center text-center">
      <p className="rubric mb-3 inline-flex items-center gap-2 rounded-full bg-surface-high px-3 py-1 text-primary shadow-sm">
        <Icon name="school" className="text-[16px]" />
        Goethe-Zertifikat B2 · Modul Schreiben
      </p>
      <h1 className="mb-2 text-4xl tracking-tight text-primary sm:text-[44px]">
        Treino Schreiben{' '}
        <span className="text-2xl font-normal text-secondary italic sm:text-3xl">
          – Aulas com a Melissa :D
        </span>
      </h1>
      <p className="max-w-2xl text-ink-soft">
        Treine a redação do exame B2 com temas reais de prova (
        <strong className="text-ink">Teil 1 + Teil 2</strong>) e envie seu texto para a correção da Melissa,
        baseada nos critérios oficiais de avaliação.
      </p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

interface DraftLoaderProps {
  readonly exercise: WritingExercise;
  readonly exercises: readonly WritingExercise[];
  readonly phraseGroups: readonly PhraseGroup[];
  readonly onSelectExercise: (exerciseId: string) => void;
  readonly onRandomExercise: () => void;
}

/** Waits for the saved draft so the session starts from it instead of an empty text. */
function DraftLoader({ exercise, ...rest }: DraftLoaderProps) {
  const { writing } = useContainer();
  const user = useSignedInUser();
  const draft = useQuery({
    queryKey: writingQueryKeys.draft(exercise.id, user.id),
    queryFn: () => writing.getDraft.execute(exercise.id, user.id),
    gcTime: 0,
  });

  if (draft.isPending) return <Spinner label="Carregando seu rascunho…" />;
  if (draft.isError) return <Alert tone="error">{writingErrorMessage(draft.error)}</Alert>;
  return (
    <WritingSession
      studentId={user.id}
      exercise={exercise}
      initialContent={draft.data?.content ?? ''}
      {...rest}
    />
  );
}
