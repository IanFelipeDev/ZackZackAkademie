import { Link } from 'react-router';
import { EmptyState } from '@/shared/ui';

function StatusPage({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <EmptyState icon={icon} title={title}>
        <p>{text}</p>
        <Link to="/" className="mt-3 inline-block font-semibold text-primary underline underline-offset-4">
          Voltar para o início
        </Link>
      </EmptyState>
    </main>
  );
}

export function ForbiddenPage() {
  return (
    <StatusPage
      icon="lock"
      title="Acesso negado"
      text="Sua conta não tem permissão para abrir esta página."
    />
  );
}

export function NotFoundPage() {
  return (
    <StatusPage
      icon="explore_off"
      title="Página não encontrada"
      text="O endereço que você abriu não existe."
    />
  );
}
