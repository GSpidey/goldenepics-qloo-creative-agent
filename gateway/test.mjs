import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { authorized, commandFor, makeGateway } from './server.mjs';
const token = 'test-only-token-with-32-characters';
const id = '12345678-abcd-1234-abcd-123456789abc';
async function fixture(t, options = {}) {
  const server = createServer(makeGateway({ token, ...options }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const url = 'http://127.0.0.1:' + server.address().port;
  return (path, body, auth = token) => fetch(url + path, { method: 'POST', headers: { authorization: 'Bearer ' + auth }, body: JSON.stringify(body) });
}
test('gateway authorization rejects missing and short tokens', () => { assert.equal(authorized('Bearer short', 'short'), false); assert.equal(authorized('Bearer ' + token, token), true); assert.equal(authorized('', token), false); });
test('only allowlisted read commands can reach the harness', () => {
  assert.deepEqual(commandFor('insights', { type: 'book', ids: [id] }), ['api', 'insights', '--type', 'book', '--signal-entities', id, '--take', '6', '--json']);
  assert.throws(() => commandFor('search', { type: '--help', query: 'example' }));
  assert.throws(() => commandFor('exec', { type: 'book' }));
});
test('cache and concurrent deduplication preserve the request allowance', async t => {
  let calls = 0;
  const request = await fixture(t, { execute: async () => { calls++; await new Promise(resolve => setTimeout(resolve, 20)); return { success: true, results: [] }; } });
  const body = { type: 'book', query: 'Example' };
  const results = await Promise.all([request('/search', body), request('/search', body)]);
  assert.deepEqual(results.map(r => r.status), [200, 200]); assert.equal(calls, 1);
  const result = await (await request('/search', body)).json(); assert.equal(result._gateway.cached, true); assert.equal(calls, 1);
});
test('account access failures are redacted and unrelated cached work remains usable', async t => {
  const request = await fixture(t, { execute: async args => { if (args.includes('bad')) throw Object.assign(new Error('private provider details'), { status: 403 }); return { success: true, results: [] }; } });
  assert.equal((await request('/search', { type: 'book', query: 'good' })).status, 200);
  const bad = await request('/search', { type: 'book', query: 'bad' }); assert.equal(bad.status, 403); assert.equal((await bad.text()).includes('private provider'), false);
  assert.equal((await request('/search', { type: 'book', query: 'good' })).status, 200);
});
test('gateway enforces request budget and validates access before calling Qloo', async t => {
  let calls = 0;
  const request = await fixture(t, { maxCalls: 1, execute: async () => { calls++; return { results: [] }; } });
  assert.equal((await request('/search', { type: 'book', query: 'first' }, 'wrong')).status, 401);
  assert.equal((await request('/search', { type: 'book', query: 'first' })).status, 200);
  assert.equal((await request('/search', { type: 'book', query: 'second' })).status, 429); assert.equal(calls, 1);
});
