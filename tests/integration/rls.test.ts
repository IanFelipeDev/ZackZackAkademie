import { beforeAll, describe, expect, it } from 'vitest';
import { adminClient, anonClient, createUser, firstExerciseId, type TestUser } from './supabase-test-env';

let student: TestUser;
let otherStudent: TestUser;
let teacher: TestUser;
let exerciseId: string;

async function insertSubmission(user: TestUser, studentId = user.id, attemptNumber = 1) {
  return user.client
    .from('writing_submissions')
    .insert({
      exercise_id: exerciseId,
      student_id: studentId,
      attempt_number: attemptNumber,
      content: 'Hallo Welt',
    })
    .select('id')
    .single();
}

beforeAll(async () => {
  [student, otherStudent, teacher] = await Promise.all([createUser(), createUser(), createUser('teacher')]);
  exerciseId = await firstExerciseId(student.client);
});

describe('profiles', () => {
  it('creates every new account as a student', async () => {
    const { data } = await student.client.from('profiles').select('role').eq('id', student.id).single();
    expect(data?.role).toBe('student');
  });

  it('does not let a student promote themselves', async () => {
    await student.client.from('profiles').update({ role: 'admin' }).eq('id', student.id);
    const { data } = await student.client.from('profiles').select('role').eq('id', student.id).single();
    expect(data?.role).toBe('student');
  });

  it('hides other profiles from students but not from teachers', async () => {
    const asStudent = await student.client.from('profiles').select('id').eq('id', otherStudent.id);
    const asTeacher = await teacher.client.from('profiles').select('id').eq('id', otherStudent.id);
    expect(asStudent.data).toHaveLength(0);
    expect(asTeacher.data).toHaveLength(1);
  });
});

describe('curriculum', () => {
  it('serves the B2 Schreiben content to signed-in users only', async () => {
    const exercises = await student.client.from('exercises').select('id', { count: 'exact', head: true });
    const phrases = await student.client.from('useful_phrases').select('id', { count: 'exact', head: true });
    const anonymous = await anonClient().from('exercises').select('id');

    expect(exercises.count).toBe(40);
    expect(phrases.count).toBeGreaterThan(0);
    expect(anonymous.data ?? []).toHaveLength(0);
  });

  it('does not let students edit content', async () => {
    const { error } = await student.client.from('useful_phrases').insert({
      task_type: 'forum_post',
      category: 'Hack',
      text: 'nope',
      position: 999,
    });
    expect(error).not.toBeNull();
  });
});

describe('writing submissions', () => {
  it('lets a student submit their own attempt but not one for someone else', async () => {
    const own = await insertSubmission(student);
    const forged = await insertSubmission(student, otherStudent.id);
    expect(own.error).toBeNull();
    expect(forged.error).not.toBeNull();
  });

  it('keeps attempts immutable', async () => {
    const { data } = await insertSubmission(student, student.id, 2);
    const submissionId = data?.id ?? '';

    await student.client.from('writing_submissions').update({ content: 'changed' }).eq('id', submissionId);
    await student.client.from('writing_submissions').delete().eq('id', submissionId);

    const { data: after } = await student.client
      .from('writing_submissions')
      .select('content')
      .eq('id', submissionId)
      .single();
    expect(after?.content).toBe('Hallo Welt');
  });

  it('hides a student submissions from other students but not from teachers', async () => {
    const asOther = await otherStudent.client
      .from('writing_submissions')
      .select('id')
      .eq('student_id', student.id);
    const asTeacher = await teacher.client
      .from('writing_submissions')
      .select('id')
      .eq('student_id', student.id);
    expect(asOther.data).toHaveLength(0);
    expect(asTeacher.data?.length).toBeGreaterThan(0);
  });

  it('does not let teachers submit attempts', async () => {
    const { error } = await insertSubmission(teacher);
    expect(error).not.toBeNull();
  });

  it('sets the attempt number and time on the server, ignoring what the client sends', async () => {
    const newcomer = await createUser();
    const first = await newcomer.client
      .from('writing_submissions')
      .insert({
        exercise_id: exerciseId,
        student_id: newcomer.id,
        attempt_number: 42,
        content: 'Hallo',
        created_at: '2000-01-01T00:00:00Z',
      })
      .select('attempt_number, created_at')
      .single();
    const second = await insertSubmission(newcomer, newcomer.id, 42);

    expect(first.error).toBeNull();
    expect(first.data?.attempt_number).toBe(1);
    expect(new Date(first.data?.created_at ?? 0).getFullYear()).toBeGreaterThan(2000);
    const { data } = await newcomer.client
      .from('writing_submissions')
      .select('attempt_number')
      .eq('id', second.data?.id ?? '')
      .single();
    expect(data?.attempt_number).toBe(2);
  });
});

describe('unpublished content', () => {
  let hiddenExerciseId: string;

  beforeAll(async () => {
    const { data: unit, error: unitError } = await adminClient
      .from('units')
      .insert({ level: 'A1', position: 900_000 + Math.floor(Math.random() * 99_999), title: 'Hidden unit' })
      .select('id')
      .single();
    if (unitError) throw unitError;
    const { data: lesson, error: lessonError } = await adminClient
      .from('lessons')
      .insert({ unit_id: unit.id, position: 1, title: 'Hidden lesson', is_published: false })
      .select('id')
      .single();
    if (lessonError) throw lessonError;
    const { data: exercise, error: exerciseError } = await adminClient
      .from('exercises')
      .insert({ lesson_id: lesson.id, prompt: 'Hidden prompt' })
      .select('id')
      .single();
    if (exerciseError) throw exerciseError;
    hiddenExerciseId = exercise.id;
  });

  it('does not let students submit or draft for an exercise they cannot see', async () => {
    const submission = await student.client
      .from('writing_submissions')
      .insert({ exercise_id: hiddenExerciseId, student_id: student.id, attempt_number: 1, content: 'x' });
    const draft = await student.client
      .from('writing_drafts')
      .insert({ exercise_id: hiddenExerciseId, student_id: student.id, content: 'x' });

    expect(submission.error).not.toBeNull();
    expect(draft.error).not.toBeNull();
  });
});

describe('feedback', () => {
  it('lets teachers review, and only the author reads the review', async () => {
    const { data: submission } = await insertSubmission(student, student.id, 3);
    const submissionId = submission?.id ?? '';

    const byStudent = await student.client
      .from('feedback')
      .insert({ submission_id: submissionId, teacher_id: student.id, comment: 'Selbstlob' });
    const byTeacher = await teacher.client
      .from('feedback')
      .insert({ submission_id: submissionId, teacher_id: teacher.id, comment: 'Gut gemacht', score: 80 });
    expect(byStudent.error).not.toBeNull();
    expect(byTeacher.error).toBeNull();

    const asAuthor = await student.client.from('feedback').select('score').eq('submission_id', submissionId);
    const asOther = await otherStudent.client
      .from('feedback')
      .select('score')
      .eq('submission_id', submissionId);
    expect(asAuthor.data).toEqual([{ score: 80 }]);
    expect(asOther.data).toHaveLength(0);
  });

  it('lets any teacher revise comment and score, stamping updated_at on the server', async () => {
    const { data: submission } = await insertSubmission(student, student.id, 4);
    const submissionId = submission?.id ?? '';
    await teacher.client
      .from('feedback')
      .insert({ submission_id: submissionId, teacher_id: teacher.id, comment: 'Gut', score: 60 });
    const created = await adminClient
      .from('feedback')
      .select('updated_at')
      .eq('submission_id', submissionId)
      .single();
    expect(created.data?.updated_at).toBeNull();

    const colleague = await createUser('teacher');
    const revised = await colleague.client
      .from('feedback')
      .update({ comment: 'Sehr gut', score: 85 })
      .eq('submission_id', submissionId)
      .select('comment, score, teacher_id, updated_at');
    expect(revised.error).toBeNull();
    expect(revised.data).toHaveLength(1);
    expect(revised.data?.[0]).toMatchObject({ comment: 'Sehr gut', score: 85, teacher_id: teacher.id });
    expect(revised.data?.[0]?.updated_at).not.toBeNull();
  });

  it('does not let students revise feedback or teachers rewrite its author or date', async () => {
    const { data: submission } = await insertSubmission(student, student.id, 5);
    const submissionId = submission?.id ?? '';
    await teacher.client
      .from('feedback')
      .insert({ submission_id: submissionId, teacher_id: teacher.id, comment: 'Gut', score: 60 });

    const byStudent = await student.client
      .from('feedback')
      .update({ score: 100 })
      .eq('submission_id', submissionId)
      .select('id');
    const newAuthor = await teacher.client
      .from('feedback')
      .update({ teacher_id: student.id })
      .eq('submission_id', submissionId);
    const newCreatedAt = await teacher.client
      .from('feedback')
      .update({ created_at: '2020-01-01T00:00:00Z' })
      .eq('submission_id', submissionId);

    expect(byStudent.data ?? []).toHaveLength(0);
    expect(newAuthor.error).not.toBeNull();
    expect(newCreatedAt.error).not.toBeNull();
    const { data } = await adminClient
      .from('feedback')
      .select('score, teacher_id, updated_at')
      .eq('submission_id', submissionId)
      .single();
    expect(data).toEqual({ score: 60, teacher_id: teacher.id, updated_at: null });
  });
});

describe('speaking', () => {
  let topicId: string;

  beforeAll(async () => {
    const { data } = await student.client
      .from('speaking_topics')
      .select('id')
      .order('position')
      .limit(1)
      .single();
    topicId = data?.id ?? '';
  });

  async function insertPractice(user: TestUser, studentId = user.id) {
    return user.client
      .from('speaking_practices')
      .insert({ topic_id: topicId, student_id: studentId, duration_seconds: 240 })
      .select('id, created_at')
      .single();
  }

  it('serves the published B2 Sprechen topics to signed-in users only', async () => {
    const topics = await student.client.from('speaking_topics').select('id', { count: 'exact', head: true });
    const anonymous = await anonClient().from('speaking_topics').select('id');
    expect(topics.count).toBe(20);
    expect(anonymous.data ?? []).toHaveLength(0);
  });

  it('hides unpublished topics from students and refuses practices for them', async () => {
    const { data: hidden } = await adminClient
      .from('speaking_topics')
      .insert({
        level: 'B2',
        task_type: 'presentation',
        position: 999,
        title: 'Entwurf',
        prompt: 'Noch geheim?',
      })
      .select('id')
      .single();
    const hiddenId = hidden?.id ?? '';

    const asStudent = await student.client.from('speaking_topics').select('id').eq('id', hiddenId);
    const asTeacher = await teacher.client.from('speaking_topics').select('id').eq('id', hiddenId);
    const practice = await student.client
      .from('speaking_practices')
      .insert({ topic_id: hiddenId, student_id: student.id, duration_seconds: 60 });

    expect(asStudent.data).toHaveLength(0);
    expect(asTeacher.data).toHaveLength(1);
    expect(practice.error).not.toBeNull();
    await adminClient.from('speaking_topics').delete().eq('id', hiddenId);
  });

  it('lets a student record their own practice with a server-side time, never for someone else', async () => {
    const own = await student.client
      .from('speaking_practices')
      .insert({
        topic_id: topicId,
        student_id: student.id,
        duration_seconds: 240,
        created_at: '2020-01-01T00:00:00Z',
      })
      .select('created_at')
      .single();
    const forOther = await insertPractice(student, otherStudent.id);
    const byTeacher = await insertPractice(teacher);

    expect(own.error).toBeNull();
    expect(new Date(own.data?.created_at ?? 0).getFullYear()).toBeGreaterThan(2020);
    expect(forOther.error).not.toBeNull();
    expect(byTeacher.error).not.toBeNull();
  });

  it('keeps practices private and immutable', async () => {
    const { data: practice } = await insertPractice(student);
    const practiceId = practice?.id ?? '';

    const asOther = await otherStudent.client.from('speaking_practices').select('id').eq('id', practiceId);
    const asTeacher = await teacher.client.from('speaking_practices').select('id').eq('id', practiceId);
    await student.client.from('speaking_practices').update({ duration_seconds: 1 }).eq('id', practiceId);
    await student.client.from('speaking_practices').delete().eq('id', practiceId);
    const { data: after } = await adminClient
      .from('speaking_practices')
      .select('duration_seconds')
      .eq('id', practiceId)
      .single();

    expect(asOther.data).toHaveLength(0);
    expect(asTeacher.data).toHaveLength(1);
    expect(after?.duration_seconds).toBe(240);
  });

  it('lets teachers assess and revise, and only the student reads the score', async () => {
    const { data: practice } = await insertPractice(student);
    const practiceId = practice?.id ?? '';

    const byStudent = await student.client
      .from('speaking_assessments')
      .insert({ practice_id: practiceId, teacher_id: student.id, score: 100 });
    const byTeacher = await teacher.client
      .from('speaking_assessments')
      .insert({ practice_id: practiceId, teacher_id: teacher.id, score: 70, comment: 'Gut' });
    expect(byStudent.error).not.toBeNull();
    expect(byTeacher.error).toBeNull();

    const revised = await teacher.client
      .from('speaking_assessments')
      .update({ score: 75 })
      .eq('practice_id', practiceId)
      .select('score, updated_at');
    const newAuthor = await teacher.client
      .from('speaking_assessments')
      .update({ teacher_id: student.id })
      .eq('practice_id', practiceId);
    const byStudentUpdate = await student.client
      .from('speaking_assessments')
      .update({ score: 100 })
      .eq('practice_id', practiceId)
      .select('id');

    expect(revised.data?.[0]?.score).toBe(75);
    expect(revised.data?.[0]?.updated_at).not.toBeNull();
    expect(newAuthor.error).not.toBeNull();
    expect(byStudentUpdate.data ?? []).toHaveLength(0);

    const asAuthor = await student.client
      .from('speaking_assessments')
      .select('score')
      .eq('practice_id', practiceId);
    const asOther = await otherStudent.client
      .from('speaking_assessments')
      .select('score')
      .eq('practice_id', practiceId);
    expect(asAuthor.data).toEqual([{ score: 75 }]);
    expect(asOther.data).toHaveLength(0);
  });
});

describe('writing drafts', () => {
  it('keeps drafts private and lets the owner overwrite them', async () => {
    const draft = { exercise_id: exerciseId, student_id: student.id, content: 'v1' };
    await student.client.from('writing_drafts').upsert(draft, { onConflict: 'student_id,exercise_id' });
    await student.client
      .from('writing_drafts')
      .upsert({ ...draft, content: 'v2' }, { onConflict: 'student_id,exercise_id' });

    const own = await student.client.from('writing_drafts').select('content').eq('exercise_id', exerciseId);
    const other = await otherStudent.client
      .from('writing_drafts')
      .select('content')
      .eq('student_id', student.id);
    expect(own.data).toEqual([{ content: 'v2' }]);
    expect(other.data).toHaveLength(0);
  });

  it('does not let a student write a draft for someone else', async () => {
    const { error } = await student.client
      .from('writing_drafts')
      .insert({ exercise_id: exerciseId, student_id: otherStudent.id, content: 'x' });
    expect(error).not.toBeNull();
  });
});
