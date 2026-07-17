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
import { Landing } from './components/Landing.jsx';
import { Planner } from './components/Planner.jsx';
import { AppUpdateProvider } from './hooks/AppUpdateProvider.jsx';
import { reset } from './styles/ui.js';

// Secondary routes stay lazy; `/` (Landing + Planner) is eager so cold loads
// do not hit defaultPendingComponent and blank the shell after auth.
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

function BootScreen({ children }) {
  return <div {...stylex.props(reset.boot)}>{children}</div>;
}

function RootLayout() {
  const { auth } = rootRoute.useRouteContext();

  if (auth.isLoading) {
    return <BootScreen>불러오는 중…</BootScreen>;
  }
  if (auth.error) {
    return <BootScreen>오류: {auth.error.message}</BootScreen>;
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
  // Avoid blanking the whole app shell while secondary lazy routes load.
  defaultPendingComponent: undefined,
});

function InnerApp() {
  const auth = db.useAuth();

  useEffect(() => {
    void router.invalidate();
  }, [auth.isLoading, auth.user]);

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
