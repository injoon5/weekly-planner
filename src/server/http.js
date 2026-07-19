/**
 * Shared Node-handler plumbing for the serverless endpoints (`api/*`).
 * Each endpoint keeps its own CORS surface; the JSON/body mechanics live here.
 */

/**
 * Build a JSON responder bound to one endpoint's CORS surface.
 * @param {{ allowHeaders: string, allowMethods: string }} cors
 * @returns {(res: import('node:http').ServerResponse, status: number, body: unknown, headers?: Record<string, string>) => void}
 */
export function createJsonResponder({ allowHeaders, allowMethods }) {
  return function json(res, status, body, headers = {}) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', allowHeaders);
    res.setHeader('Access-Control-Allow-Methods', allowMethods);
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.end(JSON.stringify(body));
  };
}

/**
 * Read and JSON-parse a request body. Empty body → `{}`; malformed JSON rejects.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<any>}
 */
export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}
