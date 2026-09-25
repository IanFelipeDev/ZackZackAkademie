// Pure module (no Deno APIs) so Vitest can test it.

export interface AccessEmailInput {
  readonly displayName: string;
  readonly email: string;
  readonly temporaryPassword: string;
  readonly loginUrl: string;
  readonly expiresAt: Date;
}

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export const ACCESS_EMAIL_SUBJECT = 'Seu acesso à Zack Zack Akademie';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}

/** First-access email with the temporary password. The password appears only here, never in logs or responses. */
export function buildAccessEmail(input: AccessEmailInput): EmailMessage {
  const name = escapeHtml(input.displayName);
  const email = escapeHtml(input.email);
  const password = escapeHtml(input.temporaryPassword);
  const loginUrl = escapeHtml(input.loginUrl);
  const expires = formatDate(input.expiresAt);

  const html = `<div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #251911">
  <h2 style="color: #751a32">Willkommen bei der Zack Zack Akademie!</h2>
  <p>Olá, ${name}!</p>
  <p>Sua conta na plataforma de estudos de alemão foi criada. Use os dados abaixo no seu primeiro acesso:</p>
  <table style="margin: 16px 0; font-family: Arial, sans-serif; font-size: 15px">
    <tr><td style="padding: 4px 12px 4px 0; color: #554244">E-mail</td><td><strong>${email}</strong></td></tr>
    <tr><td style="padding: 4px 12px 4px 0; color: #554244">Senha temporária</td>
      <td><strong style="font-family: monospace; font-size: 17px; letter-spacing: 1px">${password}</strong></td></tr>
  </table>
  <p style="margin: 24px 0">
    <a href="${loginUrl}" style="background: #943248; color: #ffffff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-family: Arial, sans-serif; font-weight: bold">Entrar na plataforma</a>
  </p>
  <p>No primeiro acesso você vai criar a sua própria senha. A senha temporária vale até <strong>${expires}</strong>.</p>
  <p style="font-size: 13px; color: #554244">Não compartilhe este e-mail. Se você não esperava este acesso, ignore esta mensagem.</p>
  <p style="font-style: italic; color: #751a32">„Übung macht den Meister“</p>
</div>`;

  const text = [
    `Olá, ${input.displayName}!`,
    '',
    'Sua conta na Zack Zack Akademie foi criada. Dados do primeiro acesso:',
    `E-mail: ${input.email}`,
    `Senha temporária: ${input.temporaryPassword}`,
    '',
    `Entre em ${input.loginUrl} e crie a sua própria senha.`,
    `A senha temporária vale até ${expires}.`,
  ].join('\n');

  return { to: input.email, subject: ACCESS_EMAIL_SUBJECT, html, text };
}
