#!/usr/bin/env node
/**
 * Register InstantDB auth redirect origins for local dev, production, and
 * Vercel preview deployments.
 *
 * Preview URLs are covered by a single `--type vercel` origin (all
 * `*-git-*.vercel.app` / deployment URLs for the project).
 *
 * Requires INSTANT_CLI_AUTH_TOKEN (from `npx instant-cli login -p`).
 * Skips quietly when the token is missing so CI/builds without secrets still pass.
 */

import { spawnSync } from 'node:child_process';

const APP_ID =
  process.env.INSTANT_APP_ID ||
  process.env.VITE_INSTANT_APP_ID ||
  '957d09d1-44df-4541-8ebe-70ba7f1388c1';

const AUTH_TOKEN = process.env.INSTANT_CLI_AUTH_TOKEN;

const VERCEL_PROJECT =
  process.env.VERCEL_PROJECT_NAME ||
  process.env.VERCEL_GIT_REPO_SLUG ||
  'weekly-planner';

const WEBSITE_ORIGINS = [
  process.env.INSTANT_AUTH_WEBSITE_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  'localhost:3000',
].filter(Boolean);

function log(...args) {
  console.log('[instant-auth-origins]', ...args);
}

function runCli(args) {
  return spawnSync('npx', ['instant-cli@latest', ...args, '--yes', '-a', APP_ID], {
    env: { ...process.env, INSTANT_CLI_AUTH_TOKEN: AUTH_TOKEN },
    encoding: 'utf8',
  });
}

function listOrigins() {
  const result = runCli(['auth', 'origin', 'list', '--json']);
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || '').trim();
    throw new Error(err || 'instant-cli auth origin list failed');
  }
  try {
    return JSON.parse(result.stdout.trim());
  } catch {
    throw new Error('Could not parse auth origin list JSON');
  }
}

function hasVercelOrigin(origins, project) {
  return origins.some(
    (o) => o.service === 'vercel' && o.params?.[0] === 'vercel.app' && o.params?.[1] === project,
  );
}

function normalizeWebsiteHost(url) {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withScheme).host;
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
}

function hasWebsiteOrigin(origins, host) {
  return origins.some((o) => o.service === 'generic' && o.params?.[0] === host);
}

function addOrigin(type, extraArgs) {
  const result = runCli(['auth', 'origin', 'add', '--type', type, ...extraArgs]);
  const out = `${result.stdout || ''}${result.stderr || ''}`.trim();
  if (result.status === 0) {
    log('added', type, extraArgs.join(' '));
    return;
  }
  if (/already|exist|duplicate/i.test(out)) {
    log('already registered', type, extraArgs.join(' '));
    return;
  }
  throw new Error(out || `instant-cli auth origin add failed (${result.status})`);
}

function main() {
  if (!AUTH_TOKEN) {
    log('INSTANT_CLI_AUTH_TOKEN not set; skipping origin sync.');
    return;
  }

  const origins = listOrigins();

  if (!hasVercelOrigin(origins, VERCEL_PROJECT)) {
    addOrigin('vercel', ['--project', VERCEL_PROJECT]);
  } else {
    log('vercel preview origin already registered for', VERCEL_PROJECT);
  }

  for (const raw of WEBSITE_ORIGINS) {
    const host = normalizeWebsiteHost(raw);
    if (!host) continue;
    if (hasWebsiteOrigin(origins, host)) {
      log('website origin already registered for', host);
      continue;
    }
    addOrigin('website', ['--url', host]);
  }

  log('done');
}

try {
  main();
} catch (err) {
  console.error('[instant-auth-origins] failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
