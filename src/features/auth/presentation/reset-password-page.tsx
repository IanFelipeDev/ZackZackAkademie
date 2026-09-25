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

/** Landing page of the recovery email; Supabase opens a temporary session from the link. */
export function ResetPasswordPage() {
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

  if (isLoading) return <FullPageSpinner />;

  if (!user) {
    return (
      <AuthLayout
        title="Link expirado"
        subtitle="Este link de recuperação não é mais válido."
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
    <AuthLayout title="Nova senha" subtitle={`Defina uma nova senha para ${user.email}.`}>
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
          Salvar nova senha
        </Button>
      </form>
    </AuthLayout>
  );
}
