import { Link } from 'wouter';
import { LayoutDashboard, ShieldCheck, Timer, GraduationCap } from 'lucide-react';

const features = [
  { icon: LayoutDashboard, title: 'One command center', body: 'Timetable, tasks, grades, and reminders in a single dashboard built for busy semesters.' },
  { icon: Timer, title: 'Focus Timer & Focus Shield', body: 'Pomodoro sessions with a distraction-free streak tracker and a blocklist for the apps that pull your attention away.' },
  { icon: GraduationCap, title: 'AI study planning', body: 'Turn your pending assignments and exams into a realistic, day-by-day study plan.' },
  { icon: ShieldCheck, title: 'Private & yours', body: 'Every course, note, and grade is scoped to your account only.' },
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between p-6 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg">S</div>
          <span className="font-display font-bold text-xl tracking-tight">Student OS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          <Link href="/sign-up" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all">Get started</Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
        <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-widest mb-6">
          Built for college life
        </span>
        <h1 className="font-display font-bold text-4xl md:text-6xl max-w-3xl leading-tight mb-6">
          Your entire semester, <span className="text-primary">organized and focused</span>.
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg mb-8">
          Student OS brings your timetable, tasks, grades, notes, and focus habits into one calm, fast workspace — with an AI planner and a Focus Shield to protect your study time.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/sign-up" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all">
            Create your free account
          </Link>
          <Link href="/sign-in" className="px-6 py-3 rounded-xl border border-border font-bold hover:bg-accent/50 transition-colors">
            Sign in
          </Link>
        </div>
      </main>

      <section className="max-w-6xl w-full mx-auto px-4 pb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-5 text-left">
            <f.icon className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-display font-bold text-base mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
