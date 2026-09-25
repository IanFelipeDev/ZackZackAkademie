import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildSubmissionForReview } from '@/features/feedback/application/testing/in-memory-review-repository';
import { WritingDraft } from '@/features/writing/domain/writing-draft';
import { ADMIN, createTestBackend, PASSWORD, renderApp, STUDENT, TEACHER } from './testing/render-app';

function signedInAs(email: string) {
  const backend = createTestBackend();
  backend.auth.signInAs(email);
  return backend;
}

describe('authentication', () => {
  it('sends anonymous visitors to the login page and back to where they were going', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/meus-textos');

    await screen.findByRole('heading', { name: 'Willkommen zurück!' });
    await user.type(screen.getByLabelText('E-mail do aluno'), STUDENT.email);
    await user.type(screen.getByLabelText('Senha de acesso'), PASSWORD);
    await user.click(screen.getByRole('button', { name: /entrar na plataforma/i }));

    await screen.findByRole('heading', { name: 'Meus Textos Salvos' });
    expect(router.state.location.pathname).toBe('/meus-textos');
  });

  it('shows a friendly message for wrong credentials', async () => {
    const user = userEvent.setup();
    renderApp('/entrar');

    await user.type(await screen.findByLabelText('E-mail do aluno'), STUDENT.email);
    await user.type(screen.getByLabelText('Senha de acesso'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /entrar na plataforma/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
  });

  it('validates the sign-up form before calling the backend', async () => {
    const user = userEvent.setup();
    renderApp('/cadastro');

    await user.type(await screen.findByLabelText('Nome'), 'Bia');
    await user.type(screen.getByLabelText('E-mail'), 'bia@example.com');
    await user.type(screen.getByLabelText('Senha'), 'secret123');
    await user.type(screen.getByLabelText('Confirmar senha'), 'different1');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText('As senhas não coincidem.')).toBeInTheDocument();
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
    const { router } = renderApp('/', backend);

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

describe('user administration', () => {
  it('lets an admin invite a teacher, who then appears in the list', async () => {
    const user = userEvent.setup();
    const backend = signedInAs(ADMIN.email);
    renderApp('/admin/usuarios', backend);

    await user.type(await screen.findByLabelText('Nome'), 'Melissa Schmidt');
    await user.type(screen.getByLabelText('E-mail'), 'melissa.schmidt@example.com');
    await user.click(screen.getByRole('radio', { name: /Professor\(a\)/ }));
    await user.click(screen.getByRole('button', { name: /enviar convite/i }));

    expect(await screen.findByText(/Convite enviado para/)).toHaveTextContent(
      'melissa.schmidt@example.com como professor(a)',
    );
    expect(backend.userAdmin.invitations[0]?.redirectTo).toBe('http://localhost:3000/definir-senha');
    expect(await screen.findByText('Melissa Schmidt')).toBeInTheDocument();
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

  it('shows the admin menu only to admins', async () => {
    renderApp('/revisoes', signedInAs(ADMIN.email));
    expect(await screen.findByRole('link', { name: 'Usuários' })).toBeInTheDocument();
  });

  it('keeps teachers out of user administration', async () => {
    renderApp('/admin/usuarios', signedInAs(TEACHER.email));
    expect(await screen.findByText('Acesso negado')).toBeInTheDocument();
  });
});
