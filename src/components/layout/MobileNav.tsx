import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Bell, 
  Calendar, 
  BookOpen, 
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MobileSidebar } from './MobileSidebar';

const mobileNavItems = [
  { title: 'Painel', href: '/dashboard', icon: Home },
  { title: 'Avisos', href: '/avisos', icon: Bell },
  { title: 'Calendário', href: '/calendario', icon: Calendar },
  { title: 'Disciplinas', href: '/disciplinas', icon: BookOpen },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-fire")} />
                <span className="text-xs font-medium">{item.title}</span>
              </Link>
            );
          })}
          
          {/* Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-muted-foreground">
                <Menu className="h-5 w-5" />
                <span className="text-xs font-medium">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-80">
              <MobileSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}

export function MobileHeader() {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-primary z-50">
      <div className="flex items-center justify-between h-full px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-fire/20 flex items-center justify-center">
            <span className="text-primary-foreground text-lg">🔥</span>
          </div>
          <h1 className="font-display text-lg text-primary-foreground tracking-wider">CFSD</h1>
        </Link>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="text-primary-foreground hover:bg-primary-foreground/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-80">
            <MobileSidebar />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
