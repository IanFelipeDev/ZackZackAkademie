import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { Alert, Button, Card } from '@/shared/ui';
import type { PhraseGroup } from '../../domain/useful-phrase';
import { countWords, evaluateWordCount } from '../../domain/word-count';
import type { WritingExercise } from '../../domain/writing-exercise';
import type { WritingSubmission } from '../../domain/writing-submission';
import { insertAtCursor } from '../insert-at-cursor';
import { useDraftAutosave } from '../use-draft-autosave';
import { useStopwatch } from '../use-stopwatch';
import { writingErrorMessage } from '../writing-error-message';
import { writingQueryKeys } from '../writing-query-keys';
import { CriteriaStrip } from './criteria-strip';
import { ExerciseBrief } from './exercise-brief';
import { RedemittelPanel } from './redemittel-panel';
import { SaveStatus } from './save-status';
import { SubmitConfirmation } from './submit-confirmation';
import { WritingMetrics } from './writing-metrics';

type MobilePane = 'brief' | 'editor';

interface WritingSessionProps {
  readonly studentId: string;
  readonly exercise: WritingExercise;
  readonly exercises: readonly WritingExercise[];
  readonly phraseGroups: readonly PhraseGroup[];
  readonly initialContent: string;
  readonly onSelectExercise: (exerciseId: string) => void;
  readonly onRandomExercise: () => void;
}

/** One writing attempt on one exercise. Remounted (via `key`) whenever the exercise changes. */
export function WritingSession({
  studentId,
  exercise,
  exercises,
  phraseGroups,
  initialContent,
  onSelectExercise,
  onRandomExercise,
}: WritingSessionProps) {
  const { writing } = useContainer();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(initialContent);
  const [checkedPoints, setCheckedPoints] = useState<ReadonlySet<number>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>('brief');
  const stopwatch = useStopwatch();
  const draft = useDraftAutosave({ exerciseId: exercise.id, studentId, content, initialContent });
  const wordCount = countWords(content);

  const submit = useMutation({
    mutationFn: () =>
      writing.submitAttempt.execute({
        exerciseId: exercise.id,
        studentId,
        content,
        durationSeconds: stopwatch.seconds > 0 ? stopwatch.seconds : null,
        guidingPointsChecked: checkedPoints.size,
      }),
    onSuccess: () => {
      setContent('');
      draft.markPersisted('');
      setCheckedPoints(new Set());
      setIsConfirming(false);
      stopwatch.reset();
      void queryClient.invalidateQueries({ queryKey: writingQueryKeys.submissions(studentId) });
      void queryClient.invalidateQueries({ queryKey: writingQueryKeys.drafts(studentId) });
    },
  });

  function updateContent(value: string) {
    setContent(value);
    submit.reset();
    if (!stopwatch.isRunning && stopwatch.seconds === 0 && value.length > 0) stopwatch.start();
  }

  function insertPhrase(phrase: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    const result = insertAtCursor(content, start, end, phrase);
    updateContent(result.value);
    setMobilePane('editor');
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(result.cursor, result.cursor);
    });
  }

  function togglePoint(index: number) {
    setCheckedPoints((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function clearText() {
    updateContent('');
    textareaRef.current?.focus();
  }

  const hasText = content.trim().length > 0;

  return (
    <>
      <div
        role="tablist"
        aria-label="Seções do treino"
        className="mb-4 grid grid-cols-2 rounded-full bg-surface-highest p-1 lg:hidden"
      >
        {(['brief', 'editor'] as const).map((pane) => (
          <button
            key={pane}
            type="button"
            role="tab"
            aria-selected={mobilePane === pane}
            onClick={() => setMobilePane(pane)}
            className={`rounded-full py-2 text-sm font-semibold ${mobilePane === pane ? 'bg-primary-container text-white' : 'text-ink-soft'}`}
          >
            {pane === 'brief' ? 'Thema & Leitpunkte' : 'Schreiben'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className={`flex-col gap-5 lg:col-span-5 lg:flex ${mobilePane === 'brief' ? 'flex' : 'hidden'}`}>
          <ExerciseBrief
            exercises={exercises}
            exercise={exercise}
            onSelect={onSelectExercise}
            onRandom={onRandomExercise}
            checkedPoints={checkedPoints}
            onTogglePoint={togglePoint}
          >
            <RedemittelPanel groups={phraseGroups} onInsert={insertPhrase} />
          </ExerciseBrief>
        </div>

        <div
          className={`flex-col gap-4 lg:col-span-7 lg:flex ${mobilePane === 'editor' ? 'flex' : 'hidden'}`}
        >
          <Card className="flex flex-col gap-5">
            <WritingMetrics
              seconds={stopwatch.seconds}
              isRunning={stopwatch.isRunning}
              onToggleTimer={stopwatch.toggle}
              onResetTimer={stopwatch.reset}
              wordCount={wordCount}
              wordRange={exercise.wordRange}
            />

            <label htmlFor="writing-area" className="sr-only">
              Seu texto
            </label>
            <textarea
              id="writing-area"
              ref={textareaRef}
              value={content}
              onChange={(event) => updateContent(event.target.value)}
              placeholder="Schreiben Sie hier Ihren Text auf Deutsch …"
              spellCheck={false}
              lang="de"
              className="min-h-[280px] w-full resize-y rounded-xl border border-hairline bg-surface-low/30 p-4 text-base leading-[1.75] text-ink transition-shadow outline-none focus:border-primary-container sm:min-h-[360px] focus:bg-surface-lowest focus:ring-4 focus:ring-primary-container/10"
            />

            {submit.isSuccess ? <SubmissionSentAlert submission={submit.data} /> : null}
            {submit.isError ? <Alert tone="error">{writingErrorMessage(submit.error)}</Alert> : null}

            {isConfirming ? (
              <SubmitConfirmation
                wordCount={wordCount}
                wordStatus={evaluateWordCount(wordCount, exercise.wordRange)}
                isSubmitting={submit.isPending}
                onConfirm={() => submit.mutate()}
                onCancel={() => setIsConfirming(false)}
              />
            ) : (
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    variant="soft"
                    icon="delete_sweep"
                    onClick={clearText}
                    disabled={!hasText}
                    className="flex-1 sm:flex-none"
                  >
                    Text leeren
                  </Button>
                  <Button
                    variant="soft"
                    icon="save"
                    onClick={draft.saveNow}
                    disabled={draft.status !== 'pending'}
                    className="flex-1 sm:flex-none"
                  >
                    Entwurf speichern
                  </Button>
                </div>
                <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                  <SaveStatus status={draft.status} lastSavedAt={draft.lastSavedAt} />
                  <Button
                    size="lg"
                    icon="send"
                    onClick={() => setIsConfirming(true)}
                    disabled={!hasText}
                    className="w-full sm:w-auto"
                  >
                    Enviar para correção
                  </Button>
                </div>
              </div>
            )}
          </Card>
          <CriteriaStrip />
        </div>
      </div>
    </>
  );
}

function SubmissionSentAlert({ submission }: { submission: WritingSubmission }) {
  return (
    <Alert tone="success">
      Tentativa {submission.attemptNumber} enviada! A Melissa vai corrigir e o feedback aparece em{' '}
      <Link to={`/meus-textos/${submission.id}`} className="font-semibold underline underline-offset-4">
        Meus Textos Salvos
      </Link>
      .
    </Alert>
  );
}
