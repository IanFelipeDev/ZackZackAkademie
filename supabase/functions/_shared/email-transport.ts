import nodemailer from 'npm:nodemailer@6.9.16';
import type { EmailMessage } from './access-email.ts';
import {
  buildProviderRequest,
  formatSender,
  parseSender,
  parseSmtpConfig,
  type EmailProvider,
} from './email-providers.ts';

/**
 * Sends transactional email. Configure with Edge Function secrets:
 *   EMAIL_TRANSPORT = "resend" (default) | "brevo" | "smtp" | "log"
 *   EMAIL_FROM      = "Zack Zack Akademie <address>" (must be a verified sender/domain at the provider)
 *   RESEND_API_KEY or BREVO_API_KEY, matching the transport
 *   smtp: SMTP_USER, SMTP_PASSWORD, optional SMTP_HOST/SMTP_PORT (defaults: Gmail on 465, see parseSmtpConfig).
 *         With Gmail, SMTP_PASSWORD is an app password and EMAIL_FROM must be SMTP_USER's own address.
 * "log" is only for local stacks and CI: it records that an email was sent, never its body (it holds a password).
 */
type Transport = EmailProvider | 'smtp' | 'log';

const API_KEY_SECRETS: Record<EmailProvider, string> = {
  resend: 'RESEND_API_KEY',
  brevo: 'BREVO_API_KEY',
};

function transport(): Transport {
  const value = Deno.env.get('EMAIL_TRANSPORT');
  if (value === 'log' || value === 'brevo' || value === 'smtp') return value;
  return 'resend';
}

function providerConfig(provider: EmailProvider) {
  const apiKey = Deno.env.get(API_KEY_SECRETS[provider]);
  const sender = parseSender(Deno.env.get('EMAIL_FROM') ?? '');
  return apiKey && sender ? { apiKey, sender } : null;
}

function smtpConfig() {
  return parseSmtpConfig({
    SMTP_HOST: Deno.env.get('SMTP_HOST'),
    SMTP_PORT: Deno.env.get('SMTP_PORT'),
    SMTP_USER: Deno.env.get('SMTP_USER'),
    SMTP_PASSWORD: Deno.env.get('SMTP_PASSWORD'),
    EMAIL_FROM: Deno.env.get('EMAIL_FROM'),
  });
}

export function isEmailConfigured(): boolean {
  const current = transport();
  if (current === 'log') return true;
  if (current === 'smtp') return smtpConfig() !== null;
  return providerConfig(current) !== null;
}

async function sendSmtp(message: EmailMessage): Promise<void> {
  const config = smtpConfig();
  if (!config) throw new Error('Email transport smtp is not configured');

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: true,
    auth: { user: config.user, pass: config.password },
  });
  // nodemailer's error messages carry the SMTP reply, never the message body.
  await transporter.sendMail({
    from: formatSender(config.sender),
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const current = transport();
  if (current === 'log') {
    console.log(`[email:log] to=${message.to} subject="${message.subject}"`);
    return;
  }
  if (current === 'smtp') return sendSmtp(message);

  const config = providerConfig(current);
  if (!config) throw new Error(`Email transport ${current} is not configured`);

  const request = buildProviderRequest(current, config.apiKey, config.sender, message);
  const response = await fetch(request.url, { method: 'POST', headers: request.headers, body: request.body });
  if (!response.ok) {
    throw new Error(`Email provider ${current} responded ${response.status}: ${await response.text()}`);
  }
}
