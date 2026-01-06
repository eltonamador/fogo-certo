import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Bell,
  Calendar,
  BookOpen,
  FileText,
  Users,
  ClipboardCheck,
  FileQuestion,
  ListTodo,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  GraduationCap,
  Flame,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('admin' | 'instrutor' | 'aluno')[];
}

const mainNavItems: NavItem[] = [
  { title: 'Painel', href: '/dashboard', icon: Home },
  { title: 'Avisos', href: '/avisos', icon: Bell },
  { title: 'Calendário', href: '/calendario', icon: Calendar },
  { title: 'Disciplinas', href: '/disciplinas', icon: BookOpen },
  { title: 'Materiais', href: '/materiais', icon: FileText },
];

const academicNavItems: NavItem[] = [
  { title: 'Frequência', href: '/frequencia', icon: ClipboardCheck },
  { title: 'Avaliações', href: '/avaliacoes', icon: FileQuestion },
  { title: 'Tarefas', href: '/tarefas', icon: ListTodo },
  { title: 'Minha Situação', href: '/minha-situacao', icon: BarChart3, roles: ['aluno'] },
  { title: 'Chamada', href: '/chamada', icon: ClipboardCheck, roles: ['admin', 'instrutor'] },
  { title: 'Relatórios', href: '/relatorios', icon: BarChart3, roles: ['admin', 'instrutor'] },
];

const adminNavItems: NavItem[] = [
  { title: 'Turmas', href: '/admin/turmas', icon: GraduationCap, roles: ['admin'] },
  { title: 'Pelotões', href: '/admin/pelotoes', icon: Shield, roles: ['admin'] },
  { title: 'Usuários', href: '/admin/usuarios', icon: Users, roles: ['admin'] },
  { title: 'Alertas', href: '/alertas', icon: AlertCircle, roles: ['admin', 'instrutor'] },
  { title: 'Relatórios Admin', href: '/admin/relatorios', icon: FileText, roles: ['admin'] },
];

export function Sidebar() {
  const location = useLocation();
  const { profile, role, signOut } = useAuth();

  const filterByRole = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.roles) return true;
      return role && item.roles.includes(role);
    });
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <Icon className={cn("h-5 w-5", isActive && "text-sidebar-primary")} />
        <span>{item.title}</span>
      </Link>
    );
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'instrutor': return 'Instrutor';
      case 'aluno': return 'Aluno';
      default: return 'Usuário';
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'admin': return Shield;
      case 'instrutor': return GraduationCap;
      default: return Users;
    }
  };

  const RoleIcon = getRoleIcon(role);

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-fire to-orange-500 flex items-center justify-center shadow-fire">
            <Flame className="h-6 w-6 text-fire-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl text-sidebar-foreground tracking-wider">CFSD</h1>
            <p className="text-xs text-sidebar-foreground/60">Sistema de Formação</p>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <RoleIcon className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.nome || 'Usuário'}
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                {getRoleLabel(role)}
              </p>
            </div>
          </div>
          {/* Widget de Notificações */}
          {(role === 'admin' || role === 'instrutor') && (
            <NotificationsDropdown />
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filterByRole(mainNavItems).map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <Separator className="my-4 bg-sidebar-border" />

        <div className="mb-2">
          <span className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Acadêmico
          </span>
        </div>
        <nav className="space-y-1">
          {filterByRole(academicNavItems).map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {role === 'admin' && (
          <>
            <Separator className="my-4 bg-sidebar-border" />
            <div className="mb-2">
              <span className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                Administração
              </span>
            </div>
            <nav className="space-y-1">
              {filterByRole(adminNavItems).map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
          </>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <Link
          to="/configuracoes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200"
        >
          <Settings className="h-5 w-5" />
          <span>Configurações</span>
        </Link>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </Button>
      </div>
    </aside>
  );
}
