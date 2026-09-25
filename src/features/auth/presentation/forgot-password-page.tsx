import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { Alert, Button, TextField } from '@/shared/ui';
import { authErrorMessage } from './auth-error-message';
import { AuthLayout } from './auth-layout';
import { forgotPasswordSchema, type ForgotPasswordValues } from './auth-schemas';
import { RESET_PASSWORD_PATH } from './auth-paths';

export function ForgotPasswordPage() {
  const { auth } = useContainer();
  const form = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });
  const request = useMutation({
    mutationFn: ({ email }: ForgotPasswordValues) =>
      auth.requestPasswordReset.execute(email, `${window.location.origin}${RESET_PASSWORD_PATH}`),
  });

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha."
      footer={
        <Link to="/entrar" className="font-semibold text-primary underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      }
    >
      {request.isSuccess ? (
        <Alert tone="success">
          Se existir uma conta com esse e-mail, você receberá o link em instantes. Confira também a caixa de
          spam.
        </Alert>
      ) : (
        <form
          noValidate
          onSubmit={form.handleSubmit((values) => request.mutate(values))}
          className="flex flex-col gap-4"
        >
          {request.isError ? <Alert tone="error">{authErrorMessage(request.error)}</Alert> : null}
          <TextField
            label="E-mail"
            icon="mail"
            type="email"
            autoComplete="email"
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />
          <Button type="submit" size="lg" isLoading={request.isPending} className="w-full">
            Enviar link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
