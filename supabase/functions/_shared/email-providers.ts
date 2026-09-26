// Pure module (no Deno APIs) so Vitest can test it: builds the HTTP request for each email provider.
import type { EmailMessage } from './access-email.ts';

export const EMAIL_PROVIDERS = ['resend', 'brevo'] as const;
export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];

export interface Sender {
  readonly name: string | null;
  readonly email: string;
}

export interface ProviderRequest {
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body: string;
}

/** Parses "Name <address>" or a bare address, as used in the EMAIL_FROM secret. */
export function parseSender(value: string): Sender | null {
  const match = /^\s*(?:(.*?)\s*<([^<>\s]+@[^<>\s]+)>|([^<>\s]+@[^<>\s]+))\s*$/.exec(value);
  if (!match) return null;
  const email = match[2] ?? match[3];
  if (!email) return null;
  const name = match[1]?.replace(/^"|"$/g, '').trim() || null;
  return { name, email };
}

function formatSender(sender: Sender): string {
  return sender.name ? `${sender.name} <${sender.email}>` : sender.email;
}

export function buildProviderRequest(
  provider: EmailProvider,
  apiKey: string,
  sender: Sender,
  message: EmailMessage,
): ProviderRequest {
  if (provider === 'brevo') {
    return {
      url: 'https://api.brevo.com/v3/smtp/email',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: sender.name ? { name: sender.name, email: sender.email } : { email: sender.email },
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
      }),
    };
  }
  return {
    url: 'https://api.resend.com/emails',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: formatSender(sender),
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  };
}
