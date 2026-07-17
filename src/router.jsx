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
import { db } from './instant.js';
import { Toaster } from './components/ui/Toaster.jsx';
import { reset } from './styles/ui.js';

const Landing = lazyRouteComponent(() => import('./components/Landing.jsx'), 'Landing');
const Login = lazyRouteComponent(() => import('./components/Login.jsx'), 'Login');
const Planner = lazyRouteComponent(() => import('./components/Planner.jsx'), 'Planner');
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

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, shareRoute, accountRoute]);

const router = createRouter({
  routeTree,
  context: {
    auth: undefined,
  },
  defaultPreload: 'intent',
  defaultPendingComponent: () => <BootScreen>불러오는 중…</BootScreen>,
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
    <div {...stylex.props(reset.app)}>
      <InnerApp />
      <Toaster />
    </div>
  );
}
