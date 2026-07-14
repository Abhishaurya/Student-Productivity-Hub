import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  UserCheck, 
  GraduationCap, 
  FileText, 
  Timer, 
  Bell 
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

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex-shrink-0 flex flex-col z-10 relative">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer block">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg group-hover:scale-110 transition-transform">
              S
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Student OS</span>
          </Link>
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="bg-accent/50 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-foreground mb-1">Stay Focused.</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">You've got this.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
        <div className="max-w-6xl mx-auto p-8 relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
}
