import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useContainer } from '@/app/context/container-context';
import { LOGIN_PATH } from '@/features/auth';
import { ROLES, type Role } from '@/shared/domain';
import { Alert, Button, Card, TextField } from '@/shared/ui';
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_MIN_LENGTH } from '../domain/invitation';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from './role-labels';
import { usersErrorMessage } from './users-error-message';
import { usersQueryKeys } from './users-query-keys';

const inviteSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(DISPLAY_NAME_MIN_LENGTH, { error: 'Informe o nome.' })
    .max(DISPLAY_NAME_MAX_LENGTH, { error: `Use no máximo ${DISPLAY_NAME_MAX_LENGTH} caracteres.` }),
  email: z.email({ error: 'Informe um e-mail válido.' }),
  role: z.enum(ROLES),
});

type InviteValues = z.infer<typeof inviteSchema>;

const DEFAULT_VALUES: InviteValues = { displayName: '', email: '', role: 'student' };

export function InviteUserForm() {
  const { users } = useContainer();
  const queryClient = useQueryClient();
  const form = useForm<InviteValues>({ resolver: zodResolver(inviteSchema), defaultValues: DEFAULT_VALUES });
  const invite = useMutation({
    mutationFn: (values: InviteValues) =>
      users.inviteUser.execute(values, `${window.location.origin}${LOGIN_PATH}`),
    onSuccess: () => {
      form.reset(DEFAULT_VALUES);
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
  const { errors } = form.formState;
  const selectedRole = useWatch({ control: form.control, name: 'role' });

  return (
    <Card>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => invite.mutate(values))}
        className="flex flex-col gap-4"
      >
        <div>
          <h2 className="text-2xl text-primary">Novo usuário</h2>
          <p className="text-sm text-ink-soft">
            A pessoa recebe por e-mail uma senha temporária e, ao entrar pela primeira vez, cria a própria
            senha (diferente da temporária). Ninguém mais vê essa senha.
          </p>
        </div>

        {invite.isSuccess ? (
          <Alert tone="success">
            Acesso criado para <strong>{invite.data.email}</strong> como{' '}
            {ROLE_LABELS[invite.data.role].toLowerCase()}. A senha temporária foi enviada por e-mail.
          </Alert>
        ) : null}
        {invite.isError ? <Alert tone="error">{usersErrorMessage(invite.error)}</Alert> : null}

        <TextField
          label="Nome"
          icon="badge"
          autoComplete="off"
          error={errors.displayName?.message}
          {...form.register('displayName')}
        />
        <TextField
          label="E-mail"
          icon="mail"
          type="email"
          autoComplete="off"
          error={errors.email?.message}
          {...form.register('email')}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold">Papel</legend>
          {ROLES.map((role: Role) => (
            <label
              key={role}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                selectedRole === role
                  ? 'border-primary-container bg-surface-low'
                  : 'border-hairline hover:bg-surface-low'
              }`}
            >
              <input
                type="radio"
                value={role}
                className="mt-1 accent-primary-container"
                {...form.register('role')}
              />
              <span>
                <span className="block text-sm font-semibold text-ink">{ROLE_LABELS[role]}</span>
                <span className="block text-xs text-ink-soft">{ROLE_DESCRIPTIONS[role]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <Button type="submit" size="lg" icon="send" isLoading={invite.isPending}>
          Criar acesso
        </Button>
      </form>
    </Card>
  );
}
