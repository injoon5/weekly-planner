/**
 * Vite on Vercel only supports single-segment dynamic API routes — Next-style
 * `[...path]` catch-alls match one segment and 404 on nested paths
 * (`/boards/:id`, `/boards/:id/events`). One entry file per depth.
 */
export { default } from '../../src/server/rest-api.js';
