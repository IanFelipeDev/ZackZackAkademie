import { beforeEach, describe, expect, it } from 'vitest';
import { EmptySubmissionError, ExerciseNotFoundError, SubmissionNotFoundError } from '../../domain/errors';
import { buildExercise, InMemoryWritingStore } from '../testing/in-memory-writing-store';
import { DeleteDraft } from './delete-draft';
import { computeWritingStats } from './compute-writing-stats';
import { GetDraft } from './get-draft';
import { GetSubmission } from './get-submission';
import { GetWritingExercise } from './get-writing-exercise';
import { ListMyDrafts } from './list-my-drafts';
import { ListMySubmissions } from './list-my-submissions';
import { ListUsefulPhrases } from './list-useful-phrases';
import { ListWritingExercises } from './list-writing-exercises';
import { SaveDraft } from './save-draft';
import { SubmitWritingAttempt } from './submit-writing-attempt';

const STUDENT = 'student-1';

let store: InMemoryWritingStore;

beforeEach(() => {
  store = new InMemoryWritingStore();
  store.exercises.push(
    buildExercise({ id: 'teil1-b', position: 2, title: 'Konsumverhalten' }),
    buildExercise({ id: 'teil1-a', position: 1 }),
    buildExercise({
      id: 'teil2-a',
      taskType: 'formal_email',
      recipient: 'Herrn Groth',
      wordRange: { min: 100, max: 120 },
    }),
  );
});

function submit(content = 'Meines Erachtens ist das Auto bequem.', exerciseId = 'teil1-a') {
  return new SubmitWritingAttempt(store.submissionRepository, store.draftRepository).execute({
    exerciseId,
    studentId: STUDENT,
    content,
    durationSeconds: 600,
    guidingPointsChecked: 4,
  });
}

describe('exercises and phrases', () => {
  it('lists exercises of one task type ordered by position', async () => {
    const exercises = await new ListWritingExercises(store.exerciseRepository).execute('forum_post');
    expect(exercises.map((e) => e.id)).toEqual(['teil1-a', 'teil1-b']);
  });

  it('loads one exercise or fails when it does not exist', async () => {
    const getExercise = new GetWritingExercise(store.exerciseRepository);
    await expect(getExercise.execute('teil2-a')).resolves.toMatchObject({ recipient: 'Herrn Groth' });
    await expect(getExercise.execute('missing')).rejects.toBeInstanceOf(ExerciseNotFoundError);
  });

  it('groups Redemittel of the requested task type', async () => {
    store.phrases.push(
      { id: '1', taskType: 'forum_post', category: 'Einleitung', text: 'Das Thema …', position: 1 },
      {
        id: '2',
        taskType: 'formal_email',
        category: 'Bitten',
        text: 'Ich wäre Ihnen dankbar …',
        position: 1,
      },
    );

    const groups = await new ListUsefulPhrases(store.phraseRepository).execute('forum_post');

    expect(groups).toEqual([{ category: 'Einleitung', phrases: [store.phrases[0]] }]);
  });
});

describe('SubmitWritingAttempt', () => {
  it('numbers attempts per exercise and never overwrites earlier ones', async () => {
    await submit('Erster Versuch');
    await submit('Zweiter Versuch');
    await submit('Anderes Thema', 'teil1-b');

    expect(store.submissions.map((s) => [s.exerciseId, s.attemptNumber, s.content])).toEqual([
      ['teil1-a', 1, 'Erster Versuch'],
      ['teil1-a', 2, 'Zweiter Versuch'],
      ['teil1-b', 1, 'Anderes Thema'],
    ]);
  });

  it('rejects an empty submission and stores nothing', async () => {
    await expect(submit('   ')).rejects.toBeInstanceOf(EmptySubmissionError);
    expect(store.submissions).toHaveLength(0);
  });

  it('removes the draft once the text is submitted', async () => {
    await new SaveDraft(store.draftRepository).execute({
      exerciseId: 'teil1-a',
      studentId: STUDENT,
      content: 'Entwurf',
    });

    await submit();

    await expect(new GetDraft(store.draftRepository).execute('teil1-a', STUDENT)).resolves.toBeNull();
  });
});

describe('drafts', () => {
  it('saves, replaces and deletes a draft', async () => {
    const saveDraft = new SaveDraft(store.draftRepository);
    const getDraft = new GetDraft(store.draftRepository);

    await saveDraft.execute({ exerciseId: 'teil1-a', studentId: STUDENT, content: 'Version 1' });
    await saveDraft.execute({ exerciseId: 'teil1-a', studentId: STUDENT, content: 'Version 2' });
    expect((await getDraft.execute('teil1-a', STUDENT))?.content).toBe('Version 2');

    await new DeleteDraft(store.draftRepository).execute('teil1-a', STUDENT);
    expect(await getDraft.execute('teil1-a', STUDENT)).toBeNull();
  });

  it('treats saving blank content as deleting the draft', async () => {
    const saveDraft = new SaveDraft(store.draftRepository);
    await saveDraft.execute({ exerciseId: 'teil1-a', studentId: STUDENT, content: 'Etwas' });

    await saveDraft.execute({ exerciseId: 'teil1-a', studentId: STUDENT, content: '  ' });

    expect(await new GetDraft(store.draftRepository).execute('teil1-a', STUDENT)).toBeNull();
  });

  it('lists the student drafts, most recently edited first', async () => {
    const saveDraft = new SaveDraft(store.draftRepository);
    await saveDraft.execute({ exerciseId: 'teil1-a', studentId: STUDENT, content: 'eins zwei' });
    await saveDraft.execute({ exerciseId: 'teil2-a', studentId: STUDENT, content: 'drei' });
    await saveDraft.execute({ exerciseId: 'teil1-b', studentId: 'someone-else', content: 'vier' });

    const drafts = await new ListMyDrafts(store.draftRepository).execute(STUDENT);

    expect(drafts.map((d) => [d.exerciseId, d.wordCount])).toEqual([
      ['teil2-a', 1],
      ['teil1-a', 2],
    ]);
  });
});

describe('submission history', () => {
  it('lists own submissions and loads one with its exercise context', async () => {
    const submission = await submit();

    const list = await new ListMySubmissions(store.submissionRepository).execute(STUDENT);
    const detail = await new GetSubmission(store.submissionRepository).execute(submission.id);

    expect(list).toHaveLength(1);
    expect(detail).toMatchObject({
      exerciseTitle: 'Auto als umweltfreundliches Verkehrsmittel',
      guidingPointsTotal: 4,
    });
  });

  it('fails when a submission is not visible', async () => {
    await expect(new GetSubmission(store.submissionRepository).execute('nope')).rejects.toBeInstanceOf(
      SubmissionNotFoundError,
    );
  });
});

describe('writing stats', () => {
  it('returns empty stats when nothing was submitted', async () => {
    const stats = computeWritingStats(await store.submissionRepository.listSummariesByStudent(STUDENT));

    expect(stats).toEqual({
      totalSubmissions: 0,
      averageWords: null,
      averageDurationSeconds: null,
      guidingPointsCoveragePercent: null,
      reviewedSubmissions: 0,
      averageScore: null,
      lastSubmittedAt: null,
    });
  });

  it('averages words, time, Leitpunkte coverage and teacher scores', async () => {
    const first = await submit('eins zwei drei vier');
    await submit('eins zwei');
    store.feedback.set(first.id, { comment: 'Gut', score: 80, createdAt: new Date() });

    const summaries = await store.submissionRepository.listSummariesByStudent(STUDENT);
    const stats = computeWritingStats(summaries);

    expect(stats).toMatchObject({
      totalSubmissions: 2,
      averageWords: 3,
      averageDurationSeconds: 600,
      guidingPointsCoveragePercent: 100,
      reviewedSubmissions: 1,
      averageScore: 80,
    });
    expect(stats.lastSubmittedAt).toBeInstanceOf(Date);
  });
});
