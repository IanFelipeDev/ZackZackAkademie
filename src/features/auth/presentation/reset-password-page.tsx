import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { Alert, Button, FullPageSpinner, TextField } from '@/shared/ui';
import { authErrorMessage } from './auth-error-message';
import { AuthLayout } from './auth-layout';
import { LOGIN_PATH } from './auth-paths';
import { useAuth } from './auth-provider';
import { CURRENT_USER_QUERY_KEY } from './auth-query-keys';
import { resetPasswordSchema, type ResetPasswordValues } from './auth-schemas';
import { homePathFor } from './home-path';

/**
 * - recovery: landing page of the "forgot password" email (Supabase opens a temporary session from the link)
 * - first-access: the signed-in user is still on the temporary password from the access email
 */
type PasswordPageMode = 'recovery' | 'first-access';

const COPY: Record<PasswordPageMode, { title: string; subtitle: (email: string) => string; submit: string }> =
  {
    recovery: {
      title: 'Nova senha',
      subtitle: (email) => `Defina uma nova senha para ${email}.`,
      submit: 'Salvar nova senha',
    },
    'first-access': {
      title: 'Bem-vindo(a)!',
      subtitle: (email) =>
        `Este é o seu primeiro acesso com ${email}. Troque a senha temporária por uma senha só sua para continuar.`,
      submit: 'Salvar senha e entrar',
    },
  };

export function ResetPasswordPage({ mode = 'recovery' }: { mode?: PasswordPageMode }) {
  const { auth } = useContainer();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });
  const update = useMutation({
    mutationFn: ({ password }: ResetPasswordValues) => auth.updatePassword.execute(password),
    onSuccess: async () => {
      // The database cleared the temporary-password flag; reload the user before routing past the guard.
      await queryClient.refetchQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      if (user) void navigate(homePathFor(user.role), { replace: true });
    },
  });
  const copy = COPY[mode];

  if (isLoading) return <FullPageSpinner />;
  if (!user && mode === 'first-access') return <Navigate to={LOGIN_PATH} replace />;

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
        <Alert tone="info">
          Os links de recuperação valem por pouco tempo e só podem ser usados uma vez.
        </Alert>
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
