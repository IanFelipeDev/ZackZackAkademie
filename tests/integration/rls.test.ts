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

  it('serves the published Goethe and telc B2 Sprechen topics to signed-in users only', async () => {
    const topics = await student.client.from('speaking_topics').select('id', { count: 'exact', head: true });
    const anonymous = await anonClient().from('speaking_topics').select('id');
    expect(topics.count).toBe(77);
    expect(anonymous.data ?? []).toHaveLength(0);
  });

  it('keeps each exam to its own parts', async () => {
    const telc = await student.client.from('speaking_topics').select('task_type').eq('exam', 'telc');
    const goethePlanning = await adminClient.from('speaking_topics').insert({
      exam: 'goethe',
      level: 'B2',
      task_type: 'planning',
      position: 999,
      title: 'Falsch',
      prompt: 'Gibt es nicht bei Goethe.',
    });
    expect(new Set((telc.data ?? []).map((t) => t.task_type))).toEqual(
      new Set(['experience', 'discussion', 'planning']),
    );
    expect(goethePlanning.error?.code).toBe('23514');
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

  it('keeps a practised topic visible after it is unpublished, but accepts no new practice for it', async () => {
    const { data: topic } = await adminClient
      .from('speaking_topics')
      .insert({
        level: 'B2',
        task_type: 'discussion',
        position: 998,
        title: 'Alt',
        prompt: 'Alt?',
        is_published: true,
      })
      .select('id')
      .single();
    const oldTopicId = topic?.id ?? '';
    await student.client
      .from('speaking_practices')
      .insert({ topic_id: oldTopicId, student_id: student.id, duration_seconds: 100 });
    await adminClient.from('speaking_topics').update({ is_published: false }).eq('id', oldTopicId);

    const asPractitioner = await student.client.from('speaking_topics').select('id').eq('id', oldTopicId);
    const asOther = await otherStudent.client.from('speaking_topics').select('id').eq('id', oldTopicId);
    const history = await student.client
      .from('speaking_practices')
      .select('id, speaking_topics!inner(title)')
      .eq('topic_id', oldTopicId);
    const again = await student.client
      .from('speaking_practices')
      .insert({ topic_id: oldTopicId, student_id: student.id, duration_seconds: 100 });

    expect(asPractitioner.data).toHaveLength(1);
    expect(asOther.data).toHaveLength(0);
    expect(history.data).toHaveLength(1);
    expect(again.error).not.toBeNull();
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

describe('speaking recordings', () => {
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

  const recordings = (user: TestUser) => user.client.storage.from('speaking-recordings');
  const upload = (user: TestUser, path: string) =>
    recordings(user).upload(path, new Blob(['voice'], { type: 'audio/webm' }), { contentType: 'audio/webm' });

  it('lets a student upload only into their own folder and attach it only to their own practice', async () => {
    const practiceId = crypto.randomUUID();
    const path = `${student.id}/${practiceId}.webm`;

    const own = await upload(student, path);
    const foreign = await upload(student, `${otherStudent.id}/${crypto.randomUUID()}.webm`);
    const byTeacher = await upload(teacher, `${teacher.id}/${crypto.randomUUID()}.webm`);
    const practice = await student.client.from('speaking_practices').insert({
      id: practiceId,
      topic_id: topicId,
      student_id: student.id,
      duration_seconds: 120,
      recording_path: path,
    });
    const pointingElsewhere = await student.client.from('speaking_practices').insert({
      topic_id: topicId,
      student_id: student.id,
      duration_seconds: 120,
      recording_path: `${otherStudent.id}/${crypto.randomUUID()}.webm`,
    });

    expect(own.error).toBeNull();
    expect(foreign.error).not.toBeNull();
    expect(byTeacher.error).not.toBeNull();
    expect(practice.error).toBeNull();
    expect(pointingElsewhere.error?.code).toBe('23514');
  });

  it('lets the student and teachers play a recording, but nobody else', async () => {
    const path = `${student.id}/${crypto.randomUUID()}.webm`;
    await upload(student, path);

    const asOwner = await recordings(student).createSignedUrl(path, 60);
    const asTeacher = await recordings(teacher).createSignedUrl(path, 60);
    const asOther = await recordings(otherStudent).createSignedUrl(path, 60);
    const anonymous = await anonClient().storage.from('speaking-recordings').createSignedUrl(path, 60);

    expect(asOwner.error).toBeNull();
    expect(asTeacher.error).toBeNull();
    expect(asOther.error).not.toBeNull();
    expect(anonymous.error).not.toBeNull();
  });

  it('does not let a student overwrite or delete a recording', async () => {
    const path = `${student.id}/${crypto.randomUUID()}.webm`;
    await upload(student, path);

    const overwrite = await recordings(student).upload(path, new Blob(['other']), {
      contentType: 'audio/webm',
      upsert: true,
    });
    await recordings(student).remove([path]);

    expect(overwrite.error).not.toBeNull();
    const { data } = await adminClient.storage.from('speaking-recordings').list(student.id);
    expect(data?.map((file) => `${student.id}/${file.name}`)).toContain(path);
  });
});

describe('flashcards', () => {
  let cardId: string;

  beforeAll(async () => {
    const { data } = await student.client.from('flashcards').select('id').order('id').limit(1).single();
    cardId = data?.id ?? '';
  });

  function markCard(user: TestUser, status: string, studentId = user.id, flashcardId = cardId) {
    return user.client
      .from('flashcard_marks')
      .upsert(
        { student_id: studentId, flashcard_id: flashcardId, status, updated_at: '2000-01-01T00:00:00Z' },
        { onConflict: 'student_id,flashcard_id' },
      );
  }

  it('serves the 810 published B2 cards to signed-in users only', async () => {
    const cards = await student.client.from('flashcards').select('id', { count: 'exact', head: true });
    const anonymous = await anonClient().from('flashcards').select('id');
    expect(cards.count).toBe(810);
    expect(anonymous.data ?? []).toHaveLength(0);
  });

  it('does not let students edit cards', async () => {
    const { error } = await student.client
      .from('flashcards')
      .insert({ level: 'B2', category: 'general', position: 9999, term: 'Hack', translation: 'nope' });
    expect(error).not.toBeNull();
  });

  it('lets a student mark a card and change the mark, with a server-side time', async () => {
    const before = Date.now();
    const first = await markCard(student, 'review');
    const second = await markCard(student, 'known');
    const { data } = await student.client
      .from('flashcard_marks')
      .select('status, updated_at')
      .eq('flashcard_id', cardId);

    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    expect(data?.map((m) => m.status)).toEqual(['known']);
    expect(new Date(data?.[0]?.updated_at ?? 0).getTime()).toBeGreaterThanOrEqual(before - 5_000);
  });

  it('keeps marks private to the student and their teachers, and never deletable', async () => {
    await markCard(student, 'review');
    await student.client.from('flashcard_marks').delete().eq('flashcard_id', cardId);

    const asOther = await otherStudent.client
      .from('flashcard_marks')
      .select('status')
      .eq('student_id', student.id);
    const asTeacher = await teacher.client
      .from('flashcard_marks')
      .select('status')
      .eq('student_id', student.id);
    expect(asOther.data).toHaveLength(0);
    expect(asTeacher.data).toEqual([{ status: 'review' }]);
  });

  it('refuses marks for someone else, from teachers, with an unknown status or on unpublished cards', async () => {
    const { data: hidden } = await adminClient
      .from('flashcards')
      .insert({ level: 'B2', category: 'general', position: 9998, term: 'Entwurf', translation: 'rascunho' })
      .select('id')
      .single();

    const forOther = await markCard(student, 'known', otherStudent.id);
    const asTeacher = await markCard(teacher, 'known');
    const unknownStatus = await markCard(student, 'maybe');
    const unpublished = await markCard(student, 'known', student.id, hidden?.id ?? '');

    expect(forOther.error).not.toBeNull();
    expect(asTeacher.error).not.toBeNull();
    expect(unknownStatus.error).not.toBeNull();
    expect(unpublished.error).not.toBeNull();
  });
});

describe('user presence', () => {
  it('records activity for the caller with the server time', async () => {
    const before = Date.now();
    const { error } = await student.client.rpc('touch_presence');
    const { data } = await adminClient
      .from('user_presence')
      .select('last_seen_at')
      .eq('user_id', student.id)
      .single();

    expect(error).toBeNull();
    expect(new Date(data?.last_seen_at ?? 0).getTime()).toBeGreaterThanOrEqual(before - 5_000);
  });

  it('shows activity to admins only', async () => {
    const admin = await createUser('admin');
    await student.client.rpc('touch_presence');

    const asAdmin = await admin.client.from('user_presence').select('user_id').eq('user_id', student.id);
    const asTeacher = await teacher.client.from('user_presence').select('user_id').eq('user_id', student.id);
    const asSelf = await student.client.from('user_presence').select('user_id').eq('user_id', student.id);

    expect(asAdmin.data).toHaveLength(1);
    expect(asTeacher.data).toHaveLength(0);
    expect(asSelf.data).toHaveLength(0);
  });

  it('does not let clients write presence directly or mark someone else', async () => {
    const forOther = await student.client
      .from('user_presence')
      .upsert({ user_id: otherStudent.id, last_seen_at: '2030-01-01T00:00:00Z' });
    const backdated = await student.client
      .from('user_presence')
      .update({ last_seen_at: '2020-01-01T00:00:00Z' })
      .eq('user_id', student.id);
    const anonymous = await anonClient().rpc('touch_presence');

    expect(forOther.error).not.toBeNull();
    expect(backdated.error).not.toBeNull();
    expect(anonymous.error).not.toBeNull();
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
