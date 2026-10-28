import { createServer } from 'node:http';
import { timingSafeEqual, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TYPES, validateSelection } from '../lib/creative.mjs';

export function commandFor(operation, input) {
  if (!TYPES.includes(input?.type)) throw Object.assign(new Error('invalid_category'), { status: 400 });
  if (operation === 'search') {
    const query = typeof input.query === 'string' ? input.query.trim() : '';
    if (query.length < 2 || query.length > 100 || /[\x00-\x1f]/.test(query)) throw Object.assign(new Error('invalid_query'), { status: 400 });
    return ['api', 'search', '--query', query, '--type', input.type, '--take', '5', '--json'];
  }
  if (operation === 'insights') {
    let ids;
    try { ids = validateSelection(input.ids); } catch { throw Object.assign(new Error('invalid_selection'), { status: 400 }); }
    return ['api', 'insights', '--type', input.type, '--signal-entities', ids.join(','), '--take', '6', '--json'];
  }
  throw Object.assign(new Error('unsupported_operation'), { status: 404 });
}
export function authorized(header, token) {
  if (!token || token.length < 24) return false;
  const a = Buffer.from(header || ''); const b = Buffer.from('Bearer ' + token);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function runHarness(args) {
  const bin = fileURLToPath(new URL('./node_modules/@qloo/qloo-harness/dist/bin.js', import.meta.url));
  return new Promise((resolve, reject) => {
    // No shell, no arbitrary flags, and no credential in the argument vector.
    execFile(process.execPath, [bin, ...args], { env: process.env, timeout: 20000, maxBuffer: 1024 * 1024, windowsHide: true }, (error, stdout) => {
      let value;
      try { value = JSON.parse(stdout); } catch { value = null; }
      if (error || value?.success === false || value?.error) {
        const providerStatus = value?.error?.status ?? value?.error?.statusCode ?? value?.status ?? (value?.code === 'API_ERROR' ? Number(/^API request failed: (\d{3})\b/.exec(value.message || '')?.[1]) : undefined);
        const status = providerStatus === 400 ? 422 : [401, 403, 429].includes(providerStatus) ? providerStatus : value?.code === 'AUTH_FAILED' ? 401 : value?.code === 'RATE_LIMITED' ? 429 : 502;
        // Raw provider output and stderr stay out of responses and logs.
        reject(Object.assign(new Error('qloo_request_failed'), { status, diagnostic:{stage:'harness',kind:error?.killed?'timeout':error?'exit':'response',exitCode:typeof error?.code==='number'?error.code:null,signal:error?.signal||null} }));
      } else if (!value || typeof value !== 'object') reject(Object.assign(new Error('invalid_qloo_response'), { status: 502 }));
      else resolve(Array.isArray(value) ? { success: true, results: { entities: value } } : value);
    });
  });
}
export function makeGateway({ token, execute = runHarness, configured = true, maxCalls = 100, now = Date.now, concurrency = 2 } = {}) {
  const cache = new Map(); const pending = new Map();
  let active = 0; let calls = 0; let day = Math.floor(now() / 86400000);
  const ttl = 10 * 60000;
  return async function handler(req, res) {
    const requestId = randomUUID();
    const send = (status, data) => { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-request-id': requestId, ...(status === 429 ? { 'retry-after': '60' } : {}) }); res.end(JSON.stringify(data)); };
    if (!authorized(req.headers.authorization, token)) return send(401, { error: 'gateway_access_required' });
    if (req.method === 'GET' && req.url === '/health') return send(200, { status: configured ? 'ready' : 'awaiting_key', liveVerified: false, harness: '0.1.26', usage: calls, limit: maxCalls });
    if (req.method !== 'POST' || !['/search', '/insights'].includes(req.url)) return send(404, { error: 'unsupported_operation' });
    try {
      let raw = ''; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 6000) return send(413, { error: 'request_too_large' }); raw += chunk; }
      let body;
      try { body = JSON.parse(raw); } catch { return send(400, { error: 'invalid_json' }); }
      const command = commandFor(req.url.slice(1), body);
      if (!configured) return send(503, { error: 'qloo_key_pending' });
      const key = JSON.stringify(command); const cached = cache.get(key);
      if (cached && cached.expires > now()) return send(200, { ...cached.value, _gateway: { cached: true } });
      if (pending.has(key)) return send(200, { ...await pending.get(key), _gateway: { cached: true } });
      const today = Math.floor(now() / 86400000);
      if (today !== day) { day = today; calls = 0; }
      if (calls >= maxCalls || active >= concurrency) return send(429, { error: 'gateway_request_allowance' });
      active++; calls++;
      const job = Promise.resolve().then(() => execute(command)); pending.set(key, job);
      try {
        const value = await job;
        if (cache.size >= 100) cache.delete(cache.keys().next().value);
        cache.set(key, { value, expires: now() + ttl });
        return send(200, { ...value, _gateway: { cached: false } });
      } finally { active--; pending.delete(key); }
    } catch (error) { return send(error.status || 502, { error: error.status === 400 ? 'invalid_request' : 'qloo_request_unavailable', requestId, ...(error.diagnostic?{diagnostic:error.diagnostic}:{}) }); }
  };
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  if (!process.env.QLOO_GATEWAY_TOKEN || process.env.QLOO_GATEWAY_TOKEN.length < 24) {
    console.error('Configure a QLOO_GATEWAY_TOKEN of at least 24 characters in the server environment.');
    process.exitCode = 1;
  } else {
    const maxCalls = Math.min(1000, Math.max(1, Number(process.env.QLOO_DAILY_MAX_CALLS) || 100));
    const server = createServer(makeGateway({ token: process.env.QLOO_GATEWAY_TOKEN, configured: Boolean(process.env.QLOO_API_KEY), maxCalls }));
    server.requestTimeout = 30000; server.headersTimeout = 10000;
    server.listen(Number(process.env.PORT) || 8788, process.env.BIND_HOST || '127.0.0.1', () => console.log('Qloo harness gateway ready.'));
  }
}
