import { db } from '../instant.js';

export function persistThemeTx(settings, theme) {
  if (!settings?.id) return null;
  return db.tx.settings[settings.id].update({ theme });
}
