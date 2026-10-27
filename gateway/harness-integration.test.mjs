import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { commandFor, runHarness } from './server.mjs';
import { normalizeEntities } from '../lib/creative.mjs';
const id = '12345678-abcd-1234-abcd-123456789abc';
// Exercises the real installed harness against a deliberately local fake API.
// This is contract verification, not proof of Qloo account access.
test('pinned Qloo harness executes both read tools and preserves entity response mapping', async t => {
  const seen = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    seen.push(url);
    assert.equal(req.headers['x-api-key'], 'local-test-placeholder');
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ success: true, results: { entities: [{ entity_id: id, name: 'Contract fixture', subtype: 'urn:entity:book', tags: [{ name: 'adventure' }] }] } }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const keys = ['QLOO_API_KEY', 'QLOO_BASE_URL', 'QLOO_TRUSTED_BASE_URL'];
  const previous = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  t.after(() => { for (const k of keys) { if (previous[k] === undefined) delete process.env[k]; else process.env[k] = previous[k]; } return new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }); });
  process.env.QLOO_API_KEY = 'local-test-placeholder';
  process.env.QLOO_BASE_URL = process.env.QLOO_TRUSTED_BASE_URL = 'http://127.0.0.1:' + server.address().port;
  const search = await runHarness(commandFor('search', { query: 'Contract fixture', type: 'book' }));
  assert.equal(normalizeEntities(search)[0].id, id);
  const insights = await runHarness(commandFor('insights', { type: 'book', ids: [id] }));
  assert.equal(normalizeEntities(insights)[0].tags[0], 'adventure');
  assert.equal(seen[0].pathname, '/search');
  assert.equal(seen[0].searchParams.get('types'), 'urn:entity:book');
  assert.equal(seen[1].pathname, '/v2/insights');
  assert.equal(seen[1].searchParams.get('signal.interests.entities'), id);
  assert.equal(seen[1].searchParams.get('take'), '6');
});
