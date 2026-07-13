import { useEffect } from 'react';
import {
  Outlet,
  RouterProvider,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';
import * as stylex from '@stylexjs/stylex';
import { db } from './db.js';
import { Login } from './components/Login.jsx';
import { Planner } from './components/Planner.jsx';
import { SharedPlanner } from './components/SharedPlanner.jsx';
import { Toaster } from './components/ui/Toaster.jsx';
import { reset } from './styles/ui.js';

function toRouterAuth(auth) {
  return {
    ...auth,
    isAuthenticated: Boolean(auth.user),
    signOut: () => db.auth.signOut(),
  };
}

function RootLayout() {
  const { auth } = rootRoute.useRouteContext();

  if (auth.isLoading) {
    return <div {...stylex.props(reset.boot)}>불러오는 중…</div>;
  }
  if (auth.error) {
    return <div {...stylex.props(reset.boot)}>오류: {auth.error.message}</div>;
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
  component: function LoginPage() {
    return <Login />;
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context }) => {
    if (!context.auth.isLoading && !context.auth.user) {
      throw redirect({ to: '/login' });
    }
  },
  component: function PlannerPage() {
    return <Planner />;
  },
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/s/$token',
  component: function SharePage() {
    return <SharedPlanner />;
  },
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, shareRoute]);

const router = createRouter({
  routeTree,
  context: {
    auth: undefined,
  },
  defaultPreload: 'intent',
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
