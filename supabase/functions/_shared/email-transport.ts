import type { EmailMessage } from './access-email.ts';

/**
 * Sends transactional email. Configure with Edge Function secrets:
 *   EMAIL_TRANSPORT = "resend" (default) | "log"
 *   RESEND_API_KEY, EMAIL_FROM (e.g. "Zack Zack Akademie <acesso@seu-dominio.com>") for "resend".
 * "log" is only for local stacks and CI: it records that an email was sent, never its body (it holds a password).
 */
type Transport = 'resend' | 'log';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function transport(): Transport {
  return Deno.env.get('EMAIL_TRANSPORT') === 'log' ? 'log' : 'resend';
}

export function isEmailConfigured(): boolean {
  if (transport() === 'log') return true;
  return Boolean(Deno.env.get('RESEND_API_KEY') && Deno.env.get('EMAIL_FROM'));
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (transport() === 'log') {
    console.log(`[email:log] to=${message.to} subject="${message.subject}"`);
    return;
  }
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY') ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('EMAIL_FROM'),
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  if (!response.ok) throw new Error(`Email provider responded ${response.status}: ${await response.text()}`);
}
