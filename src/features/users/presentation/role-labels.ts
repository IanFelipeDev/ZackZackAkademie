import type { Role } from '@/shared/domain';

export const ROLE_LABELS: Record<Role, string> = {
  student: 'Aluno(a)',
  teacher: 'Professor(a)',
  admin: 'Administrador(a)',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  student: 'Treina e envia redações.',
  teacher: 'Corrige as redações dos alunos.',
  admin: 'Corrige redações e gerencia usuários.',
};
