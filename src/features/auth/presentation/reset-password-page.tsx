import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { Alert, Button, FullPageSpinner, TextField } from '@/shared/ui';
import { authErrorMessage } from './auth-error-message';
import { AuthLayout } from './auth-layout';
import { useAuth } from './auth-provider';
import { resetPasswordSchema, type ResetPasswordValues } from './auth-schemas';
import { homePathFor } from './home-path';

type PasswordPageMode = 'recovery' | 'invite';

const COPY: Record<
  PasswordPageMode,
  { title: string; subtitle: (email: string) => string; submit: string; expired: string }
> = {
  recovery: {
    title: 'Nova senha',
    subtitle: (email) => `Defina uma nova senha para ${email}.`,
    submit: 'Salvar nova senha',
    expired: 'Os links de recuperação valem por pouco tempo e só podem ser usados uma vez.',
  },
  invite: {
    title: 'Bem-vindo(a)!',
    subtitle: (email) => `Crie a senha da sua conta ${email} para acessar a plataforma.`,
    submit: 'Criar senha e entrar',
    expired:
      'Os links de convite valem por pouco tempo e só podem ser usados uma vez. Peça um novo convite ou use "Esqueceu sua senha?".',
  },
};

/**
 * Landing page of recovery and invite emails. Supabase opens a temporary session from the link,
 * and the user sets a password for it.
 */
export function ResetPasswordPage({ mode = 'recovery' }: { mode?: PasswordPageMode }) {
  const { auth } = useContainer();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const form = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });
  const update = useMutation({
    mutationFn: ({ password }: ResetPasswordValues) => auth.updatePassword.execute(password),
    onSuccess: () => {
      if (user) void navigate(homePathFor(user.role), { replace: true });
    },
  });
  const copy = COPY[mode];

  if (isLoading) return <FullPageSpinner />;

  if (!user) {
    return (
      <AuthLayout
        title="Link expirado"
        subtitle="Este link não é mais válido."
        footer={
          <Link to="/esqueci-senha" className="font-semibold text-primary underline-offset-4 hover:underline">
            Pedir um novo link
          </Link>
        }
      >
        <Alert tone="info">{copy.expired}</Alert>
      </AuthLayout>
    );
  }

  const { errors } = form.formState;
  return (
    <AuthLayout title={copy.title} subtitle={copy.subtitle(user.email)}>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => update.mutate(values))}
        className="flex flex-col gap-4"
      >
        {update.isError ? <Alert tone="error">{authErrorMessage(update.error)}</Alert> : null}
        <TextField
          label="Nova senha"
          icon="lock"
          type="password"
          autoComplete="new-password"
          hint="mínimo de 8 caracteres"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <TextField
          label="Confirmar nova senha"
          icon="lock"
          type="password"
          autoComplete="new-password"
          error={errors.passwordConfirmation?.message}
          {...form.register('passwordConfirmation')}
        />
        <Button type="submit" size="lg" isLoading={update.isPending} className="w-full">
          {copy.submit}
        </Button>
      </form>
    </AuthLayout>
  );
}
