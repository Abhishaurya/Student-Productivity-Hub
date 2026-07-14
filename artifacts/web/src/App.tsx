import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from './components/layout';

import Dashboard from './pages/dashboard';
import Courses from './pages/courses';
import Timetable from './pages/timetable';
import Tasks from './pages/tasks';
import Attendance from './pages/attendance';
import Grades from './pages/grades';
import Notes from './pages/notes';
import Pomodoro from './pages/pomodoro';
import Reminders from './pages/reminders';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
      <h1 className="text-6xl font-display font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md">The route you requested doesn't exist in Student OS.</p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/courses" component={Courses} />
            <Route path="/timetable" component={Timetable} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/attendance" component={Attendance} />
            <Route path="/grades" component={Grades} />
            <Route path="/notes" component={Notes} />
            <Route path="/pomodoro" component={Pomodoro} />
            <Route path="/reminders" component={Reminders} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
