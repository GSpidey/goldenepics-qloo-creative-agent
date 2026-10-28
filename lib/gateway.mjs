import { TYPES, normalizeEntities, validateSelection } from './creative.mjs';
export class ServiceError extends Error {
  constructor(message, status = 503, kind = 'unavailable') { super(message); this.status = status; this.kind = kind; }
}
export async function gatewayRequest(config, operation, input, fetcher = fetch) {
  if (!config.QLOO_GATEWAY_URL || !config.QLOO_GATEWAY_TOKEN) throw new ServiceError('Live cultural research is awaiting connection. Your brief and sample workspace are ready to use.', 503, 'setup');
  const url = new URL(config.QLOO_GATEWAY_URL);
  if (url.protocol !== 'https:' && !(config.ALLOW_LOCAL_GATEWAY === '1' && ['127.0.0.1', 'localhost'].includes(url.hostname))) throw new ServiceError('The research connection needs a secure gateway address.', 503, 'setup');
  let body;
  if (operation === 'search') {
    const query = typeof input.query === 'string' ? input.query.trim() : '';
    if (query.length < 2 || query.length > 100 || !TYPES.includes(input.type)) throw new ServiceError('Enter a reference name and choose its category.', 400, 'input');
    body = { query, type: input.type };
  } else if (operation === 'insights') {
    let ids;
    try { ids = validateSelection(input.ids); } catch (e) { throw new ServiceError(e.message, 400, 'input'); }
    if (!TYPES.includes(input.type)) throw new ServiceError('Choose a supported cultural category.', 400, 'input');
    body = { ids, type: input.type };
  } else throw new ServiceError('Choose a supported research tool.', 400, 'input');
  let response;
  try {
    // Workers supports manual/follow, not the Fetch-standard error mode.
    // Return redirects as failures so authorization never follows another host.
    response = await fetcher(new URL('/' + operation, url), { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + config.QLOO_GATEWAY_TOKEN }, body: JSON.stringify(body), signal: AbortSignal.timeout(25000) });
  } catch { throw new ServiceError('Cultural research is taking a little longer. Your work is saved; try again shortly.', 503, 'connection'); }
  if (!response.ok) {
    const status = response.status;
    const problem = await response.json().catch(() => null);
    const diagnostic = problem?.diagnostic;
    // Operator-only diagnostics contain fixed categories, never provider text.
    console.warn(JSON.stringify({event:'qloo_gateway_failure',status,requestId:typeof problem?.requestId==='string'?problem.requestId.slice(0,40):undefined,stage:diagnostic?.stage==='harness'?'harness':undefined,kind:['timeout','exit','response'].includes(diagnostic?.kind)?diagnostic.kind:undefined,exitCode:typeof diagnostic?.exitCode==='number'?diagnostic.exitCode:undefined}));
    if (status === 422) throw new ServiceError('Qloo could not use this reference combination for this category. Add another cultural reference to explore it.', 422, 'reference');
    if (status === 429) throw new ServiceError('Cultural research has reached its current request allowance. Try again later.', 429, 'rate-limit');
    if (status === 401 || status === 403) throw new ServiceError('The cultural research connection needs an account access check.', 503, 'authentication');
    throw new ServiceError('Cultural research is temporarily unavailable. You can keep editing and exporting your work.', 503, 'service');
  }
  let data;
  try { data = await response.json(); } catch { throw new ServiceError('Cultural research returned an unreadable result. Try again shortly.', 502, 'response'); }
  if (data.success === false) throw new ServiceError('Cultural research could not complete this query. Try another reference.', 502, 'service');
  let items;
  try { items = normalizeEntities(data, input.type); } catch { throw new ServiceError('Cultural research returned an incomplete result. Try again shortly.', 502, 'response'); }
  return { items, fetchedAt: new Date().toISOString(), source: 'Qloo', operation, cached: data._gateway?.cached === true };
}
