import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { Alert, Button, FullPageSpinner, TextField } from '@/shared/ui';
import { authErrorMessage } from './auth-error-message';
import { AuthLayout, MotivationQuote } from './auth-layout';
import { useAuth } from './auth-provider';
import { CURRENT_USER_QUERY_KEY } from './auth-query-keys';
import { signInSchema, type SignInValues } from './auth-schemas';
import { homePathFor } from './home-path';

function redirectTarget(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('from' in state)) return null;
  return typeof state.from === 'string' ? state.from : null;
}

export function LoginPage() {
  const { auth } = useContainer();
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const form = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });
  const signIn = useMutation({
    mutationFn: (values: SignInValues) => auth.signIn.execute(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
  });

  if (isLoading) return <FullPageSpinner />;
  if (user) return <Navigate to={redirectTarget(location.state) ?? homePathFor(user.role)} replace />;

  const { errors } = form.formState;
  return (
    <AuthLayout
      title="Willkommen zurück!"
      subtitle={
        <>
          Entre na sua conta para continuar a preparação para o Goethe-Zertifikat B2 com a{' '}
          <strong className="text-primary">Melissa :D</strong>. Alunos e professores usam este mesmo acesso.
        </>
      }
      footer="Seu acesso é criado pela escola. Não recebeu? Fale com a administração."
      showBackToLanding
    >
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => signIn.mutate(values))}
        className="flex flex-col gap-4"
      >
        {signIn.isError ? <Alert tone="error">{authErrorMessage(signIn.error)}</Alert> : null}
        <TextField
          label="E-mail"
          icon="mail"
          type="email"
          autoComplete="email"
          placeholder="exemplo@email.com"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <TextField
          label="Senha de acesso"
          icon="lock"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <Link
          to="/esqueci-senha"
          className="self-end text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-container"
        >
          Esqueceu sua senha?
        </Link>
        <Button type="submit" size="lg" isLoading={signIn.isPending} className="w-full uppercase">
          Entrar na plataforma
        </Button>
      </form>
      <MotivationQuote />
    </AuthLayout>
  );
}
