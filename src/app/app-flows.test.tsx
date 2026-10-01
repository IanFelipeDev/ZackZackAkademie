import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSubmissionForReview } from '@/features/feedback/application/testing/in-memory-review-repository';
import { SpeakingPractice } from '@/features/speaking/domain/speaking-practice';
import { WritingDraft } from '@/features/writing/domain/writing-draft';
import { WritingSubmission } from '@/features/writing/domain/writing-submission';
import { ADMIN, createTestBackend, PASSWORD, renderApp, STUDENT, TEACHER } from './testing/render-app';

function signedInAs(email: string) {
  const backend = createTestBackend();
  backend.auth.signInAs(email);
  return backend;
}

describe('landing page', () => {
  it('presents the classes to visitors and links to scheduling and the login', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/');

    expect(
      await screen.findByRole('heading', { level: 1, name: /Aulas de alemão e monitoria personalizada/ }),
    ).toBeInTheDocument();
    const schedule = screen.getAllByRole('link', { name: /agendar reunião/i });
    expect(schedule.length).toBeGreaterThan(0);
    for (const link of schedule)
      expect(link.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/5511910702513\?text=/);

    const about = screen.getByRole('region', { name: /Aprendizado leve com quem viveu/ });
    expect(within(about).getByText('Profª Melissa')).toBeInTheDocument();
    expect(within(about).getByRole('img', { name: /Melissa/ })).toHaveAttribute(
      'src',
      '/landing/melissa.jpg',
    );

    const platform = screen.getByRole('region', { name: /Sua plataforma de estudos/ });
    expect(within(platform).getByText('Treino de fala com cronômetro')).toBeInTheDocument();
    expect(within(platform).getByText('Flashcards de vocabulário')).toBeInTheDocument();
    expect(within(platform).getByText('Em breve na plataforma')).toBeInTheDocument();
    expect(within(platform).getByText('Hören (audição)')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Entrar' }));
    expect(router.state.location.pathname).toBe('/entrar');
  });

  it('offers signed-in users a way back to their area', async () => {
    renderApp('/', signedInAs(TEACHER.email));
    expect(await screen.findByRole('link', { name: 'Minha área' })).toHaveAttribute('href', '/revisoes');
  });
});

describe('authentication', () => {
  it('sends anonymous visitors to the login page and back to where they were going', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/meus-textos');

    await screen.findByRole('heading', { name: 'Willkommen zurück!' });
    await user.type(screen.getByLabelText('E-mail'), STUDENT.email);
    await user.type(screen.getByLabelText('Senha de acesso'), PASSWORD);
    await user.click(screen.getByRole('button', { name: /entrar na plataforma/i }));

    await screen.findByRole('heading', { name: 'Meus Textos Salvos' });
    expect(router.state.location.pathname).toBe('/meus-textos');
  });

  it('shows a friendly message for wrong credentials', async () => {
    const user = userEvent.setup();
    renderApp('/entrar');

    await user.type(await screen.findByLabelText('E-mail'), STUDENT.email);
    await user.type(screen.getByLabelText('Senha de acesso'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /entrar na plataforma/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
  });

  it('leads from the login page back to the landing page', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/entrar');

    await user.click(await screen.findByRole('link', { name: /voltar para a página inicial/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('offers no self sign-up: access comes from an invitation', async () => {
    renderApp('/entrar');
    expect(await screen.findByText(/Seu acesso é criado pela escola/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /criar conta/i })).not.toBeInTheDocument();
  });

  it('has no sign-up page', async () => {
    renderApp('/cadastro');
    expect(await screen.findByText('Página não encontrada')).toBeInTheDocument();
  });

  it('keeps students out of the teacher area', async () => {
    renderApp('/revisoes', signedInAs(STUDENT.email));
    expect(await screen.findByText('Acesso negado')).toBeInTheDocument();
  });
});

describe('writing practice', () => {
  it('shows the selected topic with its Leitpunkte and switches to Teil 2', async () => {
    const user = userEvent.setup();
    renderApp('/treino', signedInAs(STUDENT.email));

    expect(await screen.findByText(/Sie schreiben einen Forumsbeitrag/)).toBeInTheDocument();
    expect(screen.getByText('0 / 4 cumpridos')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /teil 2/i }));

    expect(await screen.findByText(/Herrn Groth \(Museum\)/)).toBeInTheDocument();
  });

  it('inserts a Redemittel phrase into the text', async () => {
    const user = userEvent.setup();
    renderApp('/treino', signedInAs(STUDENT.email));

    await user.click(await screen.findByRole('button', { name: /redemittel anzeigen/i }));
    await user.click(screen.getByRole('button', { name: /Meines Erachtens/ }));

    expect(screen.getByLabelText('Seu texto')).toHaveValue('Meines Erachtens …');
  });

  it('submits an attempt after confirmation and records the ticked Leitpunkte', async () => {
    const user = userEvent.setup();
    const { backend } = renderApp('/treino', signedInAs(STUDENT.email));

    await user.type(
      await screen.findByLabelText('Seu texto'),
      'Ich bin der Ansicht, dass Autos praktisch sind.',
    );
    await user.click(screen.getByRole('checkbox', { name: /1\. Meinung äußern/ }));
    await user.click(screen.getByRole('button', { name: /enviar para correção/i }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('8 palavras');
    await user.click(within(dialog).getByRole('button', { name: /confirmar envio/i }));

    expect(await screen.findByText(/Tentativa 1 enviada!/)).toBeInTheDocument();
    expect(screen.getByLabelText('Seu texto')).toHaveValue('');
    expect(backend.writing.submissions).toHaveLength(1);
    expect(backend.writing.submissions[0]).toMatchObject({
      exerciseId: 'teil1-1',
      studentId: STUDENT.id,
      attemptNumber: 1,
      guidingPointsChecked: 1,
    });
  });

  it('restores a saved draft when the topic is opened again', async () => {
    const backend = signedInAs(STUDENT.email);
    await backend.writing.draftRepository.save(
      WritingDraft.create({
        exerciseId: 'teil1-2',
        studentId: STUDENT.id,
        content: 'Mein Entwurf',
      }),
    );

    renderApp('/treino?teil=1&tema=teil1-2', backend);

    expect(await screen.findByLabelText('Seu texto')).toHaveValue('Mein Entwurf');
  });
});

describe('teacher review', () => {
  it('lists pending submissions and records feedback', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(TEACHER.email);
    backend.reviews.submissions.push(buildSubmissionForReview({ id: 'sub-1', studentName: 'Ana' }));
    const { router } = renderApp('/entrar', backend);

    await user.click(await screen.findByRole('link', { name: /Konsumverhalten/ }));
    await user.type(await screen.findByLabelText(/Nota/), '85');
    await user.type(screen.getByLabelText('Comentário para o aluno'), 'Sehr gut strukturiert!');
    await user.click(screen.getByRole('button', { name: /enviar correção/i }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/revisoes'));
    expect(await screen.findByText('Tudo corrigido!')).toBeInTheDocument();
    expect(backend.reviews.saved[0]).toMatchObject({
      submissionId: 'sub-1',
      teacherId: TEACHER.id,
      score: 85,
    });
  });

  it('rejects a score outside 0–100', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(TEACHER.email);
    backend.reviews.submissions.push(buildSubmissionForReview({ id: 'sub-1' }));
    renderApp('/revisoes/sub-1', backend);

    await user.type(await screen.findByLabelText(/Nota/), '150');
    await user.type(screen.getByLabelText('Comentário para o aluno'), 'Gut');
    await user.click(screen.getByRole('button', { name: /enviar correção/i }));

    expect(await screen.findByText('A nota vai de 0 a 100.')).toBeInTheDocument();
    expect(backend.reviews.saved).toHaveLength(0);
  });
});

describe('review history', () => {
  const reviewed = () =>
    buildSubmissionForReview({
      id: 'sub-9',
      studentName: 'Bruno',
      feedback: {
        comment: 'Gut gemacht.',
        score: 70,
        teacherName: 'Melissa',
        createdAt: new Date('2026-09-10T10:00:00Z'),
        updatedAt: null,
      },
    });

  it('lists corrected texts and lets the teacher revise score and comment', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(TEACHER.email);
    backend.reviews.submissions.push(
      reviewed(),
      buildSubmissionForReview({ id: 'sub-1', studentName: 'Ana' }),
    );
    renderApp('/revisoes', backend);

    await user.click(await screen.findByRole('link', { name: 'Histórico' }));
    expect(await screen.findByRole('heading', { name: 'Histórico de correções' })).toBeInTheDocument();
    expect(screen.queryByText(/^Ana ·/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Bruno/ }));

    await user.click(await screen.findByRole('button', { name: /editar correção/i }));
    const score = screen.getByLabelText(/Nota/);
    expect(score).toHaveValue('70');
    await user.clear(score);
    await user.type(score, '80');
    await user.clear(screen.getByLabelText('Comentário para o aluno'));
    await user.type(screen.getByLabelText('Comentário para o aluno'), 'Nach Rücksprache: sehr gut.');
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText('80/100')).toBeInTheDocument();
    expect(screen.getByText('Nach Rücksprache: sehr gut.')).toBeInTheDocument();
    expect(screen.getByText(/editada em/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar para o histórico/i })).toBeInTheDocument();
  });

  it('keeps the old feedback when an edit is cancelled or invalid', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(TEACHER.email);
    backend.reviews.submissions.push(reviewed());
    renderApp('/revisoes/sub-9', backend);

    await user.click(await screen.findByRole('button', { name: /editar correção/i }));
    await user.clear(screen.getByLabelText('Comentário para o aluno'));
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));
    expect(await screen.findByText('Escreva um comentário para o aluno.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByText('Gut gemacht.')).toBeInTheDocument();
    expect(backend.reviews.submissions[0]?.feedback).toMatchObject({
      comment: 'Gut gemacht.',
      updatedAt: null,
    });
  });

  it('shows the student when the feedback was revised', async () => {
    const backend = signedInAs(STUDENT.email);
    const submission = WritingSubmission.create({
      exerciseId: 'teil1-1',
      studentId: STUDENT.id,
      content: 'Ich finde Autos praktisch.',
      attemptNumber: 1,
      durationSeconds: null,
      guidingPointsChecked: null,
    });
    backend.writing.submissions.push(submission);
    backend.writing.feedback.set(submission.id, {
      comment: 'Nach Rücksprache: sehr gut.',
      score: 80,
      createdAt: new Date('2026-09-10T10:00:00Z'),
      updatedAt: new Date('2026-09-12T10:00:00Z'),
    });
    renderApp(`/meus-textos/${submission.id}`, backend);

    expect(await screen.findByText('Nach Rücksprache: sehr gut.')).toBeInTheDocument();
    expect(screen.getByText(/atualizado em/)).toBeInTheDocument();
  });
});

describe('Sprechen', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function practiceOf(topicId: string, durationSeconds = 230) {
    return SpeakingPractice.create({ topicId, studentId: STUDENT.id, durationSeconds });
  }

  it('lets a student practise a topic with the stage timer', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    const backend = signedInAs(STUDENT.email);
    renderApp('/sprechen', backend);

    const card = await screen.findByRole('link', { name: /Homeoffice/ });
    expect(within(card).getByText('Pendente')).toBeInTheDocument();
    await user.click(card);
    await user.click(await screen.findByRole('button', { name: /abrir cronômetro/i }));

    const dialog = screen.getByRole('dialog', { name: 'Homeoffice' });
    expect(within(dialog).getByText('Introdução', { selector: 'p' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /começar/i }));
    act(() => {
      vi.advanceTimersByTime(70_000);
    });
    expect(within(dialog).getByText('Desenvolvimento', { selector: 'p' })).toBeInTheDocument();
    expect(within(dialog).getByText('02:50')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(240_000);
    });
    expect(within(dialog).getByText('Tempo excedido')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /concluir prática/i }));

    expect(await screen.findByText(/Prática registrada!/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(backend.speaking.practices).toHaveLength(1);
    expect(backend.speaking.practices[0]).toMatchObject({ topicId: 'sprechen-1', durationSeconds: 310 });
    expect(screen.getByText('Já praticado')).toBeInTheDocument();
    expect(screen.getByText('Aguardando avaliação')).toBeInTheDocument();
  });

  it('records nothing when the timer is closed without finishing', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(STUDENT.email);
    renderApp('/sprechen/sprechen-1', backend);

    await user.click(await screen.findByRole('button', { name: /abrir cronômetro/i }));
    await user.click(screen.getByRole('button', { name: /fechar cronômetro/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(backend.speaking.practices).toHaveLength(0);
  });

  it('shows the Teil 2 topics and the score history of a topic', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(STUDENT.email);
    const practice = practiceOf('sprechen-3');
    backend.speaking.practices.push(practice);
    backend.speaking.assessments.set(practice.id, {
      score: 72,
      comment: 'Gute Argumente, mehr Redemittel verwenden.',
      teacherName: 'Melissa',
      createdAt: new Date('2026-09-20T10:00:00Z'),
      updatedAt: null,
    });
    renderApp('/sprechen', backend);

    await user.click(await screen.findByRole('radio', { name: /Teil 2/ }));
    const card = await screen.findByRole('link', { name: /Handyverbot an Schulen/ });
    expect(within(card).getByText('Já praticado')).toBeInTheDocument();
    expect(within(card).getByText('Última nota 72/100')).toBeInTheDocument();
    await user.click(card);

    expect(await screen.findByText('72/100')).toBeInTheDocument();
    expect(screen.getByText('Gute Argumente, mehr Redemittel verwenden.')).toBeInTheDocument();
    expect(screen.getByText(/por cerca de 2 minutos e 30 segundos/)).toBeInTheDocument();
    expect(screen.getByText('Gesichtspunkte')).toBeInTheDocument();
    expect(screen.getByText('Como conduzir a discussão')).toBeInTheDocument();
    expect(screen.getByText('Gehen Sie auf Ihren Partner ein.')).toBeInTheDocument();
  });

  it('lets a teacher score a practice and revise the score later', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(TEACHER.email);
    backend.speaking.practices.push(practiceOf('sprechen-1'));
    renderApp('/revisoes', backend);

    await user.click(await screen.findByRole('link', { name: 'Avaliações orais' }));
    await user.click(await screen.findByRole('link', { name: /Homeoffice/ }));
    await user.type(await screen.findByLabelText(/Nota/), '78');
    await user.type(screen.getByLabelText(/Comentário para o aluno/), 'Klar strukturiert.');
    await user.click(screen.getByRole('button', { name: /enviar avaliação/i }));

    expect(await screen.findByText('Nada aguardando nota')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Avaliadas' }));
    await user.click(await screen.findByRole('link', { name: /Homeoffice/ }));
    await user.click(await screen.findByRole('button', { name: /editar avaliação/i }));
    const score = screen.getByLabelText(/Nota/);
    await user.clear(score);
    await user.type(score, '82');
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText('82/100')).toBeInTheDocument();
    expect(screen.getByText(/editada em/)).toBeInTheDocument();
  });

  it('requires a score between 0 and 100', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(TEACHER.email);
    const practice = practiceOf('sprechen-1');
    backend.speaking.practices.push(practice);
    renderApp(`/avaliacoes-orais/${practice.id}`, backend);

    await user.click(await screen.findByRole('button', { name: /enviar avaliação/i }));
    expect(await screen.findByText('Informe a nota como número inteiro.')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Nota/), '120');
    await user.click(screen.getByRole('button', { name: /enviar avaliação/i }));
    expect(await screen.findByText('A nota vai de 0 a 100.')).toBeInTheDocument();
    expect(backend.speaking.assessments.size).toBe(0);
  });

  it('keeps students out of the assessments', async () => {
    renderApp('/avaliacoes-orais', signedInAs(STUDENT.email));
    expect(await screen.findByText('Acesso negado')).toBeInTheDocument();
  });
  it('offers the telc parts with the report timer, the minimum speaking time and the Nachfragen', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    const backend = signedInAs(STUDENT.email);
    renderApp('/sprechen', backend);

    await user.click(await screen.findByRole('radio', { name: 'telc' }));
    expect(screen.getByText('telc Deutsch B2 · Mündlicher Ausdruck')).toBeInTheDocument();
    expect(screen.getAllByRole('radio', { name: /Teil/ })).toHaveLength(3);
    expect(screen.queryByRole('link', { name: /Homeoffice/ })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('link', { name: /Ein Buch, das Sie gelesen haben/ }));

    expect(await screen.findByText(/Sie haben dazu ca. 1 ½ Minuten Zeit/)).toBeInTheDocument();
    expect(screen.getByText('Stichpunkte')).toBeInTheDocument();
    expect(screen.getByText('Würden Sie das Buch weiterempfehlen?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /abrir cronômetro/i }));

    const dialog = screen.getByRole('dialog', { name: 'Ein Buch, das Sie gelesen haben' });
    expect(within(dialog).getByText('Seu relato', { selector: 'p' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /começar/i }));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(within(dialog).getByText('Tempo mínimo de fala: faltam 00:30')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(within(dialog).getByText('Tempo mínimo de fala (01:30) atingido')).toBeInTheDocument();
    expect(within(dialog).getByText('Perguntas do parceiro', { selector: 'p' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('checkbox', { name: 'Einleitung' }));
    expect(within(dialog).getByText('Estrutura do relato · 1/4')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /concluir prática/i }));
    expect(await screen.findByText(/Prática registrada!/)).toBeInTheDocument();
    expect(backend.speaking.practices[0]).toMatchObject({ topicId: 'telc-1', durationSeconds: 90 });
    expect(screen.getByRole('link', { name: /voltar para os temas/i })).toHaveAttribute(
      'href',
      '/sprechen?prova=telc&teil=1',
    );
  });

  it('shows the telc Teil 2 text and tracks who is talking', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    renderApp('/sprechen?prova=telc&teil=2', signedInAs(STUDENT.email));

    await user.click(await screen.findByRole('link', { name: /Die Vier-Tage-Woche/ }));
    expect(await screen.findByText('Vier Tage arbeiten, drei Tage frei.')).toBeInTheDocument();
    expect(screen.getByText(/Sprechen Sie über mögliche Lösungen/)).toBeInTheDocument();
    expect(screen.queryByText('Como conduzir a discussão')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /abrir cronômetro/i }));

    const dialog = screen.getByRole('dialog', { name: 'Die Vier-Tage-Woche' });
    await user.click(within(dialog).getByRole('button', { name: /começar/i }));
    act(() => {
      vi.advanceTimersByTime(90_000);
    });
    await user.click(within(dialog).getByRole('button', { name: /Parceiro/ }));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(within(dialog).getByText(/Você 90% · parceiro\(a\) 10%/)).toBeInTheDocument();
    expect(within(dialog).getByText(/tente equilibrar/)).toBeInTheDocument();
  });

  it('runs the 20-minute telc preparation before the Teil 3 planning task', async () => {
    const user = userEvent.setup();
    renderApp('/sprechen?prova=telc&teil=3', signedInAs(STUDENT.email));

    await user.click(await screen.findByRole('link', { name: /Sommerfest im Deutschkurs/ }));
    expect(await screen.findByText('Das müssen Sie gemeinsam entscheiden')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /preparação \(20 minutos\)/i }));

    const preparation = screen.getByRole('dialog', { name: 'Sommerfest im Deutschkurs' });
    expect(within(preparation).getByText('Preparação', { selector: 'p' })).toBeInTheDocument();
    expect(within(preparation).getByText('20:00', { selector: 'p' })).toBeInTheDocument();
    await user.click(within(preparation).getByRole('button', { name: /começar a falar/i }));

    const practice = screen.getByRole('dialog', { name: 'Sommerfest im Deutschkurs' });
    expect(within(practice).getByText('Introdução', { selector: 'p' })).toBeInTheDocument();
    await user.click(within(practice).getByRole('checkbox', { name: 'Essen und Getränke' }));
    expect(within(practice).getByText('Decidam juntos · 1/2')).toBeInTheDocument();
  });
});

describe('Flashcards', () => {
  it('flips a card and saves whether the student knows it or wants to review it', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(STUDENT.email);
    renderApp('/painel', backend);

    await user.click(await screen.findByRole('link', { name: 'Flashcards' }));
    expect(
      await screen.findByRole('progressbar', { name: '0 de 3 palavras realizadas' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Cartão 1 de 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Lebenslauf/ }));
    expect(screen.getByRole('button', { name: /currículo/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /já sei/i }));

    expect(backend.flashcards.marks.get(STUDENT.id)?.get('card-1')?.status).toBe('known');
    expect(screen.getByRole('progressbar', { name: '1 de 3 palavras realizadas' })).toBeInTheDocument();
    expect(screen.getByText('Cartão 2 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gehalt/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /a revisar/i }));
    expect(backend.flashcards.marks.get(STUDENT.id)?.get('card-2')?.status).toBe('review');

    await user.click(screen.getByRole('radio', { name: 'A revisar: 1' }));
    expect(screen.getByText('Cartão 1 de 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gehalt/ })).toBeInTheDocument();
  });

  it('filters by category, shows the synonyms and moves with the arrow keys', async () => {
    const user = userEvent.setup();
    renderApp('/flashcards', signedInAs(STUDENT.email));

    await user.click(await screen.findByRole('radio', { name: /Sinônimos e Paráfrases/ }));
    await user.click(screen.getByRole('button', { name: /notwendig/ }));
    expect(screen.getByText('erforderlich · unumgänglich')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Realizados: 0' }));
    expect(screen.getByText('Nenhum cartão realizado ainda')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Trabalho e Profissão/ }));
    await user.click(screen.getByRole('radio', { name: 'Todos: 2' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Cartão 2 de 2')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Cartão 1 de 2')).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: /Gehalt/ })).toBeInTheDocument();
  });

  it('keeps teachers out of the flashcards', async () => {
    const { router } = renderApp('/flashcards', signedInAs(TEACHER.email));
    await waitFor(() => expect(router.state.location.pathname).toBe('/acesso-negado'));
  });
});

describe('performance dashboard', () => {
  it('is the student home and shows Schreiben and Sprechen progress, with Lesen and Hören coming soon', async () => {
    const backend = signedInAs(STUDENT.email);
    const submission = WritingSubmission.create({
      exerciseId: 'teil1-1',
      studentId: STUDENT.id,
      content: 'Ich finde Autos praktisch.',
      attemptNumber: 1,
      durationSeconds: 600,
      guidingPointsChecked: 2,
    });
    backend.writing.submissions.push(submission);
    backend.writing.feedback.set(submission.id, {
      comment: 'Gut',
      score: 80,
      createdAt: new Date('2026-09-10T10:00:00Z'),
      updatedAt: null,
    });
    const practice = SpeakingPractice.create({
      topicId: 'sprechen-1',
      studentId: STUDENT.id,
      durationSeconds: 240,
    });
    backend.speaking.practices.push(
      practice,
      SpeakingPractice.create({ topicId: 'sprechen-1', studentId: STUDENT.id, durationSeconds: 200 }),
    );
    backend.speaking.assessments.set(practice.id, {
      score: 70,
      comment: '',
      teacherName: 'Melissa',
      createdAt: new Date('2026-09-12T10:00:00Z'),
      updatedAt: null,
    });
    const { router } = renderApp('/entrar', backend);

    await screen.findByRole('heading', { name: 'Painel de desempenho' });
    expect(router.state.location.pathname).toBe('/painel');

    const schreiben = await screen.findByRole('article', { name: 'Schreiben' });
    expect(within(schreiben).getByText('1 de 1 textos corrigidos')).toBeInTheDocument();
    expect(within(schreiben).getByText('80/100')).toBeInTheDocument();

    const sprechen = screen.getByRole('article', { name: 'Sprechen' });
    expect(within(sprechen).getByText('1 de 6 temas praticados')).toBeInTheDocument();
    expect(within(sprechen).getByRole('progressbar', { name: '1 de 6 temas praticados' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    expect(within(sprechen).getByText('70/100')).toBeInTheDocument();

    for (const skill of ['Lesen', 'Hören']) {
      expect(within(screen.getByRole('article', { name: skill })).getByText('Em breve')).toBeInTheDocument();
    }

    const activity = screen.getByRole('region', { name: 'Últimas correções e avaliações' });
    const links = within(activity).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      `/sprechen/sprechen-1`,
      `/meus-textos/${submission.id}`,
    ]);
  });

  it('starts empty for a new student', async () => {
    renderApp('/painel', signedInAs(STUDENT.email));

    expect(await screen.findByText('Nenhum texto enviado ainda.')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma prática registrada ainda.')).toBeInTheDocument();
    expect(screen.getByText(/a nota aparece aqui/)).toBeInTheDocument();
  });
});

describe('presence', () => {
  it('reports activity while a signed-in user uses the app', async () => {
    const backend = signedInAs(STUDENT.email);
    renderApp('/meus-textos', backend);

    await screen.findByRole('heading', { name: 'Meus Textos Salvos' });
    await waitFor(() => expect(backend.auth.activity).toContain(STUDENT.id));
  });

  it('shows admins who is online and when everyone was last seen', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(ADMIN.email);
    const seen = (id: string, minutesAgo: number | null) => {
      const account = backend.userAdmin.users.find((u) => u.id === id);
      if (!account) throw new Error(`Unknown user ${id}`);
      Object.assign(account, {
        lastSeenAt: minutesAgo === null ? null : new Date(Date.now() - minutesAgo * 60_000),
      });
    };
    seen(STUDENT.id, 1);
    seen(TEACHER.id, 45);
    seen(ADMIN.id, null);
    renderApp('/admin/usuarios', backend);

    const row = (name: string) => screen.getByText(name, { selector: 'p' }).closest('li') as HTMLElement;
    expect(await screen.findByText('1 pessoa online agora')).toBeInTheDocument();
    expect(within(row(STUDENT.displayName)).getByText('Online agora')).toBeInTheDocument();
    expect(within(row(TEACHER.displayName)).getByText('Último acesso há 45 min')).toBeInTheDocument();
    expect(within(row(ADMIN.displayName)).getByText('Nenhum acesso registrado')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /online agora/ }));
    expect(screen.getByText(STUDENT.displayName, { selector: 'p' })).toBeInTheDocument();
    expect(screen.queryByText(TEACHER.displayName, { selector: 'p' })).not.toBeInTheDocument();
  });
});

describe('user administration', () => {
  it('lets an admin create a teacher account; the temporary password goes by email', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(ADMIN.email);
    renderApp('/admin/usuarios', backend);

    await user.type(await screen.findByLabelText('Nome'), 'Melissa Schmidt');
    await user.type(screen.getByLabelText('E-mail'), 'melissa.schmidt@example.com');
    await user.click(screen.getByRole('radio', { name: /Professor\(a\)/ }));
    await user.click(screen.getByRole('button', { name: /criar acesso/i }));

    expect(await screen.findByText(/Acesso criado para/)).toHaveTextContent(
      'melissa.schmidt@example.com como professor(a)',
    );
    expect(backend.userAdmin.sentEmails[0]?.loginUrl).toBe('http://localhost:3000/entrar');
    const row = (await screen.findByText('Melissa Schmidt')).closest('li');
    expect(row).toHaveTextContent('Aguardando primeiro acesso');
  });

  it('changes the role of another user but not of the admin themself', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(ADMIN.email);
    renderApp('/admin/usuarios', backend);

    expect(await screen.findByLabelText('Papel de Ian')).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Papel de Ana'), 'teacher');

    await waitFor(() =>
      expect(backend.userAdmin.users.find((u) => u.id === STUDENT.id)?.role).toBe('teacher'),
    );
  });

  it('deactivates an account after confirmation and reactivates it', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(ADMIN.email);
    renderApp('/admin/usuarios', backend);

    await user.click(await screen.findByRole('button', { name: 'Desativar Ana' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar desativação de Ana' }));

    await waitFor(() =>
      expect(backend.userAdmin.users.find((u) => u.id === STUDENT.id)?.accessStatus).toBe('deactivated'),
    );
    await user.click(await screen.findByRole('button', { name: 'Reativar Ana' }));
    await waitFor(() =>
      expect(backend.userAdmin.users.find((u) => u.id === STUDENT.id)?.accessStatus).toBe('active'),
    );
  });

  it('deletes an account after confirmation', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(ADMIN.email);
    renderApp('/admin/usuarios', backend);

    await user.click(await screen.findByRole('button', { name: 'Excluir Ana' }));
    expect(screen.getByText(/Não pode ser desfeito/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão de Ana' }));

    await waitFor(() => expect(screen.queryByText('Ana')).not.toBeInTheDocument());
    expect(backend.userAdmin.users.some((u) => u.id === STUDENT.id)).toBe(false);
  });

  it('explains why a teacher who gave feedback cannot be deleted', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(ADMIN.email);
    backend.userAdmin.reviewerIds.add(TEACHER.id);
    renderApp('/admin/usuarios', backend);

    await user.click(await screen.findByRole('button', { name: `Excluir ${TEACHER.displayName}` }));
    await user.click(screen.getByRole('button', { name: `Confirmar exclusão de ${TEACHER.displayName}` }));

    expect(await screen.findByText(/já corrigiu textos/)).toBeInTheDocument();
    expect(backend.userAdmin.users.some((u) => u.id === TEACHER.id)).toBe(true);
  });

  it('resends access with a new temporary password', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(ADMIN.email);
    renderApp('/admin/usuarios', backend);

    await user.click(await screen.findByRole('button', { name: 'Reenviar acesso de Ana' }));

    expect(await screen.findByText(/Nova senha temporária enviada para ana@example.com/)).toBeInTheDocument();
    expect(backend.userAdmin.sentEmails).toEqual([
      { userId: STUDENT.id, loginUrl: 'http://localhost:3000/entrar' },
    ]);
  });

  it('offers no account actions on the admin themself', async () => {
    renderApp('/admin/usuarios', signedInAs(ADMIN.email));
    await screen.findByLabelText('Papel de Ian');
    expect(screen.queryByRole('button', { name: 'Desativar Ian' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reenviar acesso de Ian' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir Ian' })).not.toBeInTheDocument();
  });

  it('shows the admin menu only to admins', async () => {
    renderApp('/revisoes', signedInAs(ADMIN.email));
    expect(await screen.findByRole('link', { name: 'Usuários' })).toBeInTheDocument();
  });

  it('keeps teachers out of user administration', async () => {
    renderApp('/admin/usuarios', signedInAs(TEACHER.email));
    expect(await screen.findByText('Acesso negado')).toBeInTheDocument();
  });
});

describe('first access', () => {
  it('forces a user on a temporary password to choose their own before using the app', async () => {
    const user = userEvent.setup();
    const backend = createTestBackend();
    backend.auth.addAccount(
      { ...STUDENT, email: 'nova@example.com', mustChangePassword: true },
      'Temp0rary22',
    );
    backend.auth.signInAs('nova@example.com');
    const { router } = renderApp('/treino', backend);

    await screen.findByRole('heading', { name: 'Bem-vindo(a)!' });
    expect(router.state.location.pathname).toBe('/trocar-senha');

    await user.type(screen.getByLabelText('Nova senha'), 'minha-senha-123');
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'minha-senha-123');
    await user.click(screen.getByRole('button', { name: /salvar senha e entrar/i }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/painel'));
    expect(await screen.findByRole('heading', { name: 'Painel de desempenho' })).toBeInTheDocument();
  });

  it('does not accept the temporary password as the new password', async () => {
    const user = userEvent.setup();
    const backend = createTestBackend();
    backend.auth.addAccount(
      { ...STUDENT, email: 'nova@example.com', mustChangePassword: true },
      'Temp0rary22',
    );
    backend.auth.signInAs('nova@example.com');
    const { router } = renderApp('/treino', backend);

    await user.type(await screen.findByLabelText('Nova senha'), 'Temp0rary22');
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'Temp0rary22');
    await user.click(screen.getByRole('button', { name: /salvar senha e entrar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('precisa ser diferente da senha temporária');
    expect(router.state.location.pathname).toBe('/trocar-senha');
  });

  it('sends visitors without a session from the first-access page to the login', async () => {
    const { router } = renderApp('/trocar-senha');
    await screen.findByRole('heading', { name: 'Willkommen zurück!' });
    expect(router.state.location.pathname).toBe('/entrar');
  });
});
