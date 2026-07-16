import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Switch, Redirect, useLocation, Router as WouterRouter } from 'wouter';
import { ClerkProvider, Show, useClerk } from '@clerk/react';
import { shadcn } from '@clerk/themes';
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
import FocusShield from './pages/focus-shield';
import Landing from './pages/landing';
import SignInPage from './pages/sign-in';
import SignUpPage from './pages/sign-up';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains. Do not inline the env var, leave
// publishableKey undefined, or replace publishableKeyFromHost with anything else.
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly), auto-set
// in prod. Do NOT gate on import.meta.env.PROD / NODE_ENV — the empty dev value
// is intentional, and any branching breaks the prod proxy.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: 'hsl(160 100% 22%)',
    colorForeground: 'hsl(160 50% 15%)',
    colorMutedForeground: 'hsl(160 30% 40%)',
    colorDanger: 'hsl(0 84% 60%)',
    colorBackground: 'hsl(160 30% 99%)',
    colorInput: 'hsl(160 20% 96%)',
    colorInputForeground: 'hsl(160 50% 15%)',
    colorNeutral: 'hsl(160 20% 88%)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[hsl(160,30%,99%)] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-[hsl(160,20%,88%)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-display font-bold text-2xl text-[hsl(160,50%,15%)]',
    headerSubtitle: 'text-[hsl(160,30%,40%)]',
    socialButtonsBlockButtonText: 'font-semibold text-[hsl(160,50%,15%)]',
    formFieldLabel: 'font-semibold text-[hsl(160,50%,15%)]',
    footerActionLink: 'font-bold text-[hsl(160,100%,22%)] hover:text-[hsl(160,100%,18%)]',
    footerActionText: 'text-[hsl(160,30%,40%)]',
    dividerText: 'text-[hsl(160,30%,40%)]',
    identityPreviewEditButton: 'text-[hsl(160,100%,22%)]',
    formFieldSuccessText: 'text-[hsl(160,100%,22%)]',
    alertText: 'text-[hsl(0,84%,45%)]',
    logoBox: 'mb-2',
    logoImage: 'h-10 w-10',
    socialButtonsBlockButton: 'border border-[hsl(160,20%,88%)] hover:bg-[hsl(150,60%,95%)]',
    formButtonPrimary: 'bg-[hsl(160,100%,22%)] hover:bg-[hsl(160,100%,18%)] text-white font-bold',
    formFieldInput: 'border border-[hsl(160,20%,88%)] focus:border-[hsl(160,100%,22%)]',
    footerAction: 'text-sm',
    dividerLine: 'bg-[hsl(160,20%,88%)]',
    alert: 'bg-[hsl(0,84%,97%)] border border-[hsl(0,84%,85%)]',
    otpCodeFieldInput: 'border border-[hsl(160,20%,88%)]',
    formFieldRow: '',
    main: '',
  },
};

function LandingOrRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>{children}</Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
      <h1 className="text-6xl font-display font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md">The route you requested doesn't exist in Student OS.</p>
    </div>
  );
}

// Helps the webview stay up-to-date when the signed-in user changes by invalidating the QueryClient cache.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to get back to your semester',
          },
        },
        signUp: {
          start: {
            title: 'Create your Student OS account',
            subtitle: 'Organize your semester and stay focused',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={LandingOrRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/dashboard">{() => <AppShell><Dashboard /></AppShell>}</Route>
          <Route path="/courses">{() => <AppShell><Courses /></AppShell>}</Route>
          <Route path="/timetable">{() => <AppShell><Timetable /></AppShell>}</Route>
          <Route path="/tasks">{() => <AppShell><Tasks /></AppShell>}</Route>
          <Route path="/attendance">{() => <AppShell><Attendance /></AppShell>}</Route>
          <Route path="/grades">{() => <AppShell><Grades /></AppShell>}</Route>
          <Route path="/notes">{() => <AppShell><Notes /></AppShell>}</Route>
          <Route path="/pomodoro">{() => <AppShell><Pomodoro /></AppShell>}</Route>
          <Route path="/reminders">{() => <AppShell><Reminders /></AppShell>}</Route>
          <Route path="/focus-shield">{() => <AppShell><FocusShield /></AppShell>}</Route>
          <Route>{() => <AppShell><NotFound /></AppShell>}</Route>
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
