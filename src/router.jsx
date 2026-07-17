import { useEffect } from 'react';
import {
  Outlet,
  RouterProvider,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router';
import * as stylex from '@stylexjs/stylex';
import { db } from './db/instant.js';
import { Toaster } from './components/ui/Toaster.jsx';
import { AppUpdateProvider } from './hooks/AppUpdateProvider.jsx';
import { reset } from './styles/ui.js';

// Split Landing vs Planner so signed-in cold loads don't pull marketing JS
// (and vice versa). Compact BootStatus covers the brief chunk gap.
const Landing = lazyRouteComponent(() => import('./components/Landing.jsx'), 'Landing');
const Planner = lazyRouteComponent(() => import('./components/Planner.jsx'), 'Planner');
const Login = lazyRouteComponent(() => import('./components/Login.jsx'), 'Login');
const SharedPlanner = lazyRouteComponent(
  () => import('./components/SharedPlanner.jsx'),
  'SharedPlanner',
);
const Account = lazyRouteComponent(() => import('./components/Account.jsx'), 'Account');

function toRouterAuth(auth) {
  return {
    ...auth,
    isAuthenticated: Boolean(auth.user),
    signOut: () => db.auth.signOut(),
  };
}

function BootStatus({ children, error = false }) {
  return (
    <div {...stylex.props(reset.boot)} role={error ? 'alert' : 'status'} aria-live="polite">
      {!error && <span {...stylex.props(reset.bootSpinner)} aria-hidden="true" />}
      {children}
    </div>
  );
}

function RootLayout() {
  const { auth } = rootRoute.useRouteContext();

  // Don't blank every route while Instant auth resolves — only `/` needs a
  // compact gate (IndexPage). Login/landing/share paint immediately.
  if (auth.error) {
    return <BootStatus error>오류: {auth.error.message}</BootStatus>;
  }
  return <Outlet />;
}

const rootRoute = createRootRouteWithContext()({
  component: RootLayout,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: ({ context }) => {
    if (!context.auth.isLoading && context.auth.user) {
      throw redirect({ to: '/' });
    }
  },
  component: Login,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function IndexPage() {
    const { auth } = rootRoute.useRouteContext();
    // Compact status only when we have no user yet — Instant often restores
    // a cached session with `user` set while `isLoading` is still true.
    if (auth.isLoading && !auth.user) {
      return <BootStatus>불러오는 중…</BootStatus>;
    }
    // Signed-out visitors get the marketing landing page (with guest sign-in);
    // signed-in users — including guests — go straight to their planner.
    return auth.user ? <Planner /> : <Landing />;
  },
});

// Marketing page always — signed-in users see open-planner CTAs instead of guest/login.
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  component: Landing,
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/s/$token',
  component: SharedPlanner,
});

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  beforeLoad: ({ context }) => {
    if (!context.auth.isLoading && !context.auth.user) {
      throw redirect({ to: '/login' });
    }
  },
  component: Account,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  loginRoute,
  shareRoute,
  accountRoute,
]);

const router = createRouter({
  routeTree,
  context: {
    auth: undefined,
  },
  defaultPreload: 'intent',
  // Compact status while lazy Landing/Planner/secondary chunks resolve.
  defaultPendingComponent: () => <BootStatus>불러오는 중…</BootStatus>,
});

function InnerApp() {
  const auth = db.useAuth();

  useEffect(() => {
    void router.invalidate();
  }, [auth.isLoading, auth.user?.id]);

  return <RouterProvider router={router} context={{ auth: toRouterAuth(auth) }} />;
}

export function App() {
  return (
    <AppUpdateProvider>
      <div {...stylex.props(reset.app)}>
        <InnerApp />
        <Toaster />
      </div>
    </AppUpdateProvider>
  );
}
