import { Link, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  UserCheck, 
  GraduationCap, 
  FileText, 
  Timer, 
  Bell,
  Menu,
  X
} from 'lucide-react';
import { cn } from './ui';

const navItems = [
  { href: '/', label: 'Command Center', icon: LayoutDashboard },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/timetable', label: 'Timetable', icon: Calendar },
  { href: '/tasks', label: 'Tasks & Exams', icon: CheckSquare },
  { href: '/attendance', label: 'Attendance', icon: UserCheck },
  { href: '/grades', label: 'Grades & CGPA', icon: GraduationCap },
  { href: '/notes', label: 'Smart Notes', icon: FileText },
  { href: '/pomodoro', label: 'Focus Timer', icon: Timer },
  { href: '/reminders', label: 'Reminders', icon: Bell },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="h-[100dvh] bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card z-20 shrink-0">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer block">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg">
            S
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Student OS</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 border-r border-border bg-card flex-shrink-0 flex flex-col z-40 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer block">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg group-hover:scale-110 transition-transform">
              S
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Student OS</span>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl font-semibold text-sm transition-all group active:scale-[0.98] md:active:scale-100",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto hidden md:block">
          <div className="bg-accent/50 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-foreground mb-1">Stay Focused.</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">You've got this.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative min-h-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
        <div className="max-w-6xl w-full mx-auto p-4 md:p-8 relative z-0 h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
