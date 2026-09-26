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

  it('offers no self sign-up: access comes from an invitation', async () => {
    renderApp('/entrar');
    expect(await screen.findByText(/O convite é enviado pela sua professora/)).toBeInTheDocument();
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

    await waitFor(() => expect(router.state.location.pathname).toBe('/treino'));
    expect(await screen.findByText(/Sie schreiben einen Forumsbeitrag/)).toBeInTheDocument();
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
