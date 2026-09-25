import { useQuery } from '@tanstack/react-query';
import { useContainer } from '@/app/context/container-context';
import { useSignedInUser } from '@/features/auth';
import { Alert, PageHeader, Spinner } from '@/shared/ui';
import { InviteUserForm } from './invite-user-form';
import { usersErrorMessage } from './users-error-message';
import { usersQueryKeys } from './users-query-keys';
import { UsersTable } from './users-table';

export function UsersAdminPage() {
  const { users } = useContainer();
  const currentUser = useSignedInUser();
  const list = useQuery({ queryKey: usersQueryKeys.all, queryFn: () => users.listUsers.execute() });

  return (
    <div>
      <PageHeader
        eyebrow="Administração"
        title="Usuários"
        description="Convide alunos, professores e administradores e ajuste o papel de cada conta."
      />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <InviteUserForm />
        </div>
        <div className="lg:col-span-7">
          {list.isPending ? <Spinner /> : null}
          {list.isError ? <Alert tone="error">{usersErrorMessage(list.error)}</Alert> : null}
          {list.data ? <UsersTable users={list.data} currentUserId={currentUser.id} /> : null}
        </div>
      </div>
    </div>
  );
}
