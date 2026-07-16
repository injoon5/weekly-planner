import { init, id } from '@instantdb/react';
import { APP_ID } from './config.js';
import schema from './schema.js';

// Instant persists recent query subscriptions to IndexedDB and syncs when
// back online — no extra offline wiring needed for app data.
export const db = init({ appId: APP_ID, schema });

export { id };

/** @param {any} tx @param {Record<string, unknown> | null | undefined} ruleParams */
export function withRuleParams(tx, ruleParams) {
  if (!ruleParams || !Object.keys(ruleParams).length) return tx;
  return tx.ruleParams(ruleParams);
}
