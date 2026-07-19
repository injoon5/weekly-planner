/**
 * Session-authenticated JSON calls to the app's serverless endpoints
 * (`/api/tokens`, `/api/invite`): header `token` carries the Instant refresh
 * token, bodies and responses are JSON.
 *
 * @param {string} path
 * @param {{ method?: string, refreshToken?: string, body?: unknown }} [options]
 * @returns {Promise<{ ok: boolean, payload: any }>} `payload` is `{}` when the
 *   response body is missing or malformed.
 */
export async function sessionRequest(path, { method = 'POST', refreshToken, body } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      token: refreshToken || '',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => ({}));
  return { ok: res.ok, payload };
}
