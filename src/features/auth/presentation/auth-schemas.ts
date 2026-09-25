import { z } from 'zod';
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_MIN_LENGTH, PASSWORD_MIN_LENGTH } from '../domain/user';

const email = z.email({ error: 'Informe um e-mail válido.' });
const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { error: `A senha precisa de pelo menos ${PASSWORD_MIN_LENGTH} caracteres.` });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Informe sua senha.' }),
});

export const signUpSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(DISPLAY_NAME_MIN_LENGTH, { error: 'Informe seu nome.' })
      .max(DISPLAY_NAME_MAX_LENGTH, { error: `Use no máximo ${DISPLAY_NAME_MAX_LENGTH} caracteres.` }),
    email,
    password,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    error: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, passwordConfirmation: z.string() })
  .refine((data) => data.password === data.passwordConfirmation, {
    error: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
