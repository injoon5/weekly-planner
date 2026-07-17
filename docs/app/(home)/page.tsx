import Link from 'next/link';

const sections = [
  {
    href: '/docs',
    title: 'Overview',
    description: 'What Weekly Planner is and how the stack fits together.',
  },
  {
    href: '/docs/getting-started',
    title: 'Getting started',
    description: 'Local setup, InstantDB, and environment variables.',
  },
  {
    href: '/docs/architecture',
    title: 'Architecture',
    description: 'Routing, data layer, styling, and entry points.',
  },
  {
    href: '/docs/domain',
    title: 'Domain model',
    description: 'Schema, permissions, roles, and board/event rules.',
  },
  {
    href: '/docs/features',
    title: 'Features',
    description: 'Auth, grid, sharing, presence, print, and more.',
  },
  {
    href: '/docs/api',
    title: 'API & deploy',
    description: 'Vercel functions, middleware, and production setup.',
  },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-fd-muted-foreground">
          Documentation
        </p>
        <h1 className="text-4xl font-bold tracking-tight">Weekly Planner</h1>
        <p className="max-w-2xl text-lg text-fd-muted-foreground">
          Internal docs for the realtime weekly timetable — React, Vite,
          TanStack Router, StyleX, InstantDB, and Vercel.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/docs"
            className="rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground"
          >
            Read the docs
          </Link>
          <Link
            href="/docs/getting-started"
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Get started
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border p-5 transition-colors hover:bg-fd-accent"
          >
            <h2 className="mb-1 font-semibold">{section.title}</h2>
            <p className="text-sm text-fd-muted-foreground">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
