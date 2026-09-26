import type { EmailMessage } from './access-email.ts';
import { buildProviderRequest, parseSender, type EmailProvider } from './email-providers.ts';

/**
 * Sends transactional email. Configure with Edge Function secrets:
 *   EMAIL_TRANSPORT = "resend" (default) | "brevo" | "log"
 *   EMAIL_FROM      = "Zack Zack Akademie <address>" (must be a verified sender/domain at the provider)
 *   RESEND_API_KEY or BREVO_API_KEY, matching the transport
 * "log" is only for local stacks and CI: it records that an email was sent, never its body (it holds a password).
 */
type Transport = EmailProvider | 'log';

const API_KEY_SECRETS: Record<EmailProvider, string> = {
  resend: 'RESEND_API_KEY',
  brevo: 'BREVO_API_KEY',
};

function transport(): Transport {
  const value = Deno.env.get('EMAIL_TRANSPORT');
  if (value === 'log' || value === 'brevo') return value;
  return 'resend';
}

function providerConfig(provider: EmailProvider) {
  const apiKey = Deno.env.get(API_KEY_SECRETS[provider]);
  const sender = parseSender(Deno.env.get('EMAIL_FROM') ?? '');
  return apiKey && sender ? { apiKey, sender } : null;
}

export function isEmailConfigured(): boolean {
  const current = transport();
  return current === 'log' || providerConfig(current) !== null;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const current = transport();
  if (current === 'log') {
    console.log(`[email:log] to=${message.to} subject="${message.subject}"`);
    return;
  }
  const config = providerConfig(current);
  if (!config) throw new Error(`Email transport ${current} is not configured`);

  const request = buildProviderRequest(current, config.apiKey, config.sender, message);
  const response = await fetch(request.url, { method: 'POST', headers: request.headers, body: request.body });
  if (!response.ok) {
    throw new Error(`Email provider ${current} responded ${response.status}: ${await response.text()}`);
  }
}
