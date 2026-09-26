// Pure module (no Deno APIs) so Vitest can test it.
// Layout from the school's welcome email design; table-based with inline styles for email clients.

export interface AccessEmailInput {
  readonly displayName: string;
  readonly email: string;
  readonly temporaryPassword: string;
  readonly loginUrl: string;
}

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export const ACCESS_EMAIL_SUBJECT = 'Bem-vindo(a) à Zack Zack Akademie! Seu acesso chegou ✨';

/** Served by the web app (public/brand). Email clients need an absolute URL. */
const LOGO_PATH = '/brand/logo-512.png';
const SCHOOL_NAME = 'Zack Zack - Akademie für Deutsch lernen';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** First-access email with the temporary password. The password appears only here, never in logs or responses. */
export function buildAccessEmail(input: AccessEmailInput): EmailMessage {
  const name = escapeHtml(input.displayName);
  const email = escapeHtml(input.email);
  const password = escapeHtml(input.temporaryPassword);
  const loginUrl = escapeHtml(input.loginUrl);
  const logoUrl = escapeHtml(new URL(LOGO_PATH, input.loginUrl).toString());

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo(a) à Zack Zack Akademie!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9f6f0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9f6f0; padding: 20px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #ebd9b4;">
          <tr>
            <td align="center" style="padding: 40px 20px 20px 20px; background-color: #ffffff;">
              <img src="${logoUrl}" alt="${SCHOOL_NAME}" width="220" style="display: block; width: 100%; max-width: 220px; height: auto; border: 0;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #ebd9b4; margin: 0;">
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; color: #4a3e3d; font-size: 16px; line-height: 1.6;">
              <h1 style="color: #8b263e; font-size: 24px; font-weight: 700; margin-top: 0; text-align: center;">
                Herzlich willkommen! ✨🩷
              </h1>
              <p style="margin-top: 20px;">Olá, <strong>${name}</strong>!</p>
              <p>
                Seja muito bem-vindo(a) à <strong>${SCHOOL_NAME}</strong>! ✨ Estamos imensamente felizes por ter você
                conosco nessa jornada rumo ao domínio do alemão. 🩷
              </p>
              <p>
                A partir de agora, você tem em suas mãos todas as ferramentas para aprender o idioma de forma prática,
                leve e eficiente. Nosso objetivo é guiar você em cada passo para que conquiste sua fluência e alcance
                todos os seus objetivos! 🌟
              </p>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fdf8f3; border-left: 4px solid #8b263e; border-radius: 6px; margin: 25px 0;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="margin: 0 0 10px 0; color: #8b263e; font-weight: bold; font-size: 16px;">
                      🔑 Seus dados de primeiro acesso
                    </p>
                    <p style="margin: 0; font-size: 15px; color: #4a3e3d;">E-mail: <strong>${email}</strong></p>
                    <p style="margin: 6px 0 0 0; font-size: 15px; color: #4a3e3d;">
                      Senha temporária:
                      <strong style="font-family: 'Courier New', monospace; font-size: 18px; letter-spacing: 1px; color: #8b263e;">${password}</strong>
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 13px; color: #555555;">
                      Assim que entrar pela primeira vez, você vai criar a sua própria senha (diferente desta).
                    </p>
                  </td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" target="_blank" style="background-color: #8b263e; color: #ffffff; padding: 15px 30px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; border: 1px solid #d4af37;">
                      Acessar Minha Conta ✨
                    </a>
                  </td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fdf8f3; border-left: 4px solid #d4af37; border-radius: 6px; margin: 0 0 25px 0;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="margin: 0; color: #8b263e; font-weight: bold; font-size: 16px;">✨ Dica para começar com o pé direito:</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #555555;">
                      Acesse a plataforma, explore as primeiras aulas e junte-se à nossa comunidade de alunos! 🩷
                    </p>
                  </td>
                </tr>
              </table>

              <p>
                Aproveite bastante a plataforma e aprenda muito! Lembre-se: com dedicação e o método certo, falar alemão
                fica muito mais simples. 🩷✨
              </p>
              <p style="margin-bottom: 0;">
                Com todo o carinho,<br>
                <strong style="color: #8b263e;">Equipe ${SCHOOL_NAME}</strong> 🩷
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fdf8f3; padding: 25px 40px; text-align: center; border-top: 1px solid #ebd9b4; color: #888888; font-size: 12px;">
              <p style="margin: 0 0 8px 0;"><strong>${SCHOOL_NAME}</strong> ✨🩷</p>
              <p style="margin: 0;">
                Você recebeu este e-mail porque uma conta foi criada para você na nossa plataforma.<br>
                Não compartilhe sua senha. Se você não esperava este e-mail, pode ignorá-lo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Olá, ${input.displayName}!`,
    '',
    `Seja muito bem-vindo(a) à ${SCHOOL_NAME}!`,
    '',
    'Seus dados de primeiro acesso:',
    `E-mail: ${input.email}`,
    `Senha temporária: ${input.temporaryPassword}`,
    '',
    `Acesse ${input.loginUrl}. No primeiro acesso você vai criar a sua própria senha (diferente desta).`,
    '',
    `Com todo o carinho,`,
    `Equipe ${SCHOOL_NAME}`,
  ].join('\n');

  return { to: input.email, subject: ACCESS_EMAIL_SUBJECT, html, text };
}
