import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { Alert, Button, FullPageSpinner, TextField } from '@/shared/ui';
import { authErrorMessage } from './auth-error-message';
import { AuthLayout } from './auth-layout';
import { useAuth } from './auth-provider';
import { CURRENT_USER_QUERY_KEY } from './auth-query-keys';
import { signUpSchema, type SignUpValues } from './auth-schemas';
import { homePathFor } from './home-path';

export function SignUpPage() {
  const { auth } = useContainer();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const form = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });
  const signUp = useMutation({
    mutationFn: (values: SignUpValues) => auth.signUp.execute(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
  });

  if (isLoading) return <FullPageSpinner />;
  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const loginLink = (
    <Link to="/entrar" className="font-semibold text-primary underline-offset-4 hover:underline">
      Entrar
    </Link>
  );

  if (signUp.data?.needsEmailConfirmation) {
    return (
      <AuthLayout
        title="Quase lá!"
        subtitle="Só falta confirmar seu e-mail."
        footer={<>Já confirmou? {loginLink}</>}
      >
        <Alert tone="success">
          Enviamos um link de confirmação para <strong>{form.getValues('email')}</strong>. Abra o e-mail e
          clique no link para ativar sua conta.
        </Alert>
      </AuthLayout>
    );
  }

  const { errors } = form.formState;
  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Cadastre-se para treinar o Schreiben do B2 e guardar todas as suas redações."
      footer={<>Já tem conta? {loginLink}</>}
    >
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => signUp.mutate(values))}
        className="flex flex-col gap-4"
      >
        {signUp.isError ? <Alert tone="error">{authErrorMessage(signUp.error)}</Alert> : null}
        <TextField
          label="Nome"
          icon="badge"
          autoComplete="name"
          error={errors.displayName?.message}
          {...form.register('displayName')}
        />
        <TextField
          label="E-mail"
          icon="mail"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <TextField
          label="Senha"
          icon="lock"
          type="password"
          autoComplete="new-password"
          hint="mínimo de 8 caracteres"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <TextField
          label="Confirmar senha"
          icon="lock"
          type="password"
          autoComplete="new-password"
          error={errors.passwordConfirmation?.message}
          {...form.register('passwordConfirmation')}
        />
        <Button type="submit" size="lg" isLoading={signUp.isPending} className="w-full uppercase">
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  );
}
