/**
 * Instant link fields may arrive as a row object or a bare id string.
 * @param {unknown} value
 * @returns {string | null}
 */
export function linkedId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = /** @type {{ id?: unknown }} */ (value).id;
    return typeof id === 'string' ? id : null;
  }
  return null;
}

/**
 * @param {unknown[]} [values]
 * @returns {string[]}
 */
export function linkedIds(values) {
  return (values || []).map(linkedId).filter(Boolean);
}
