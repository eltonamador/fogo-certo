import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/database';

export type Permission = 
  // View permissions
  | 'view:dashboard'
  | 'view:avisos'
  | 'view:calendario'
  | 'view:disciplinas'
  | 'view:materiais'
  | 'view:frequencia'
  | 'view:avaliacoes'
  | 'view:tarefas'
  | 'view:minha-situacao'
  | 'view:chamada'
  | 'view:relatorios'
  | 'view:admin-usuarios'
  | 'view:admin-turmas'
  | 'view:admin-pelotoes'
  // CRUD permissions
  | 'create:aula'
  | 'edit:aula'
  | 'delete:aula'
  | 'create:material'
  | 'edit:material'
  | 'delete:material'
  | 'create:avaliacao'
  | 'edit:avaliacao'
  | 'delete:avaliacao'
  | 'create:tarefa'
  | 'edit:tarefa'
  | 'delete:tarefa'
  | 'create:aviso'
  | 'edit:aviso'
  | 'delete:aviso'
  | 'submit:entrega'
  | 'submit:resposta'
  | 'manage:presenca'
  | 'manage:usuarios'
  | 'manage:turmas'
  | 'manage:pelotoes'
  | 'manage:disciplinas'
  | 'change:roles';

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  aluno: [
    'view:dashboard',
    'view:avisos',
    'view:calendario',
    'view:disciplinas',
    'view:materiais',
    'view:frequencia',
    'view:avaliacoes',
    'view:tarefas',
    'view:minha-situacao',
    'submit:entrega',
    'submit:resposta',
  ],
  instrutor: [
    'view:dashboard',
    'view:avisos',
    'view:calendario',
    'view:disciplinas',
    'view:materiais',
    'view:frequencia',
    'view:avaliacoes',
    'view:tarefas',
    'view:chamada',
    'view:relatorios',
    'create:aula',
    'edit:aula',
    'create:material',
    'edit:material',
    'create:avaliacao',
    'edit:avaliacao',
    'create:tarefa',
    'edit:tarefa',
    'create:aviso',
    'edit:aviso',
    'manage:presenca',
  ],
  admin: [
    'view:dashboard',
    'view:avisos',
    'view:calendario',
    'view:disciplinas',
    'view:materiais',
    'view:frequencia',
    'view:avaliacoes',
    'view:tarefas',
    'view:chamada',
    'view:relatorios',
    'view:admin-usuarios',
    'view:admin-turmas',
    'view:admin-pelotoes',
    'create:aula',
    'edit:aula',
    'delete:aula',
    'create:material',
    'edit:material',
    'delete:material',
    'create:avaliacao',
    'edit:avaliacao',
    'delete:avaliacao',
    'create:tarefa',
    'edit:tarefa',
    'delete:tarefa',
    'create:aviso',
    'edit:aviso',
    'delete:aviso',
    'manage:presenca',
    'manage:usuarios',
    'manage:turmas',
    'manage:pelotoes',
    'manage:disciplinas',
    'change:roles',
  ],
};

// Map routes to required permissions
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/dashboard': 'view:dashboard',
  '/avisos': 'view:avisos',
  '/calendario': 'view:calendario',
  '/disciplinas': 'view:disciplinas',
  '/materiais': 'view:materiais',
  '/frequencia': 'view:frequencia',
  '/avaliacoes': 'view:avaliacoes',
  '/tarefas': 'view:tarefas',
  '/minha-situacao': 'view:minha-situacao',
  '/chamada': 'view:chamada',
  '/relatorios': 'view:relatorios',
  '/admin/usuarios': 'view:admin-usuarios',
  '/admin/turmas': 'view:admin-turmas',
  '/admin/pelotoes': 'view:admin-pelotoes',
};

export function useRBAC() {
  const { role, user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canAccessRoute = (route: string): boolean => {
    const permission = ROUTE_PERMISSIONS[route];
    if (!permission) return true; // If no permission defined, allow access
    return hasPermission(permission);
  };

  const isAdmin = role === 'admin';
  const isInstrutor = role === 'instrutor';
  const isAluno = role === 'aluno';

  // Check if this is the bootstrap admin
  const isBootstrapAdmin = isAdmin && user?.email === 'elton.amador@gmail.com';

  return {
    role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    isAdmin,
    isInstrutor,
    isAluno,
    isBootstrapAdmin,
    permissions: role ? ROLE_PERMISSIONS[role] : [],
  };
}
