import test from 'node:test';
import assert from 'node:assert/strict';
import { makeDirections, makeExport, normalizeEntities, sampleBrief, sampleResearch, sampleSeeds, toMarkdown, validateSelection } from '../lib/creative.mjs';
import { gatewayRequest } from '../lib/gateway.mjs';
const id = '12345678-abcd-1234-abcd-123456789abc';
test('sample export preserves truthful fictional provenance and every evidence link', () => {
  const doc = makeExport(sampleBrief, sampleSeeds, sampleResearch, 'direction-2');
  assert.match(doc.source, /Fictional/); assert.equal(doc.selectedDirection.id, 'direction-2');
  const ids = doc.research.groups.flatMap(g => g.items.map(e => e.id));
  for (const direction of doc.directions) for (const ref of direction.evidenceIds) assert.ok(ids.includes(ref));
  assert.match(toMarkdown(doc), /not individual preferences/); assert.match(toMarkdown(doc), /No language model/);
});
test('incomplete brief cannot be represented as a finished creative direction', () => assert.throws(() => makeDirections({ product: 'X' }, sampleResearch)));
test('no evidence returns no fabricated directions', () => assert.deepEqual(makeDirections(sampleBrief, { groups: [] }), []));
test('normalization distinguishes popularity from affinity', () => {
  const [entity] = normalizeEntities({ results: { entities: [{ entity_id: id, name: 'Example', popularity: .99, query: {}, tags: [{ name: 'adventure' }] }] } });
  assert.equal(entity.affinity, undefined); assert.deepEqual(entity.tags, ['adventure']);
});
test('handles array and entities responses while rejecting malformed results', () => {
  assert.equal(normalizeEntities({ results: [{ entity_id: id, name: 'Example' }] }).length, 1);
  assert.throws(() => normalizeEntities({ results: { entities: 'invalid' } }));
});
test('live inputs reject sample IDs and arbitrary URL or shell fragments', () => {
  for (const invalid of [['sample:thing'], [id + '?token=x'], ['$(echo x)'], []]) assert.throws(() => validateSelection(invalid));
  assert.deepEqual(validateSelection([id, id]), [id]);
});
test('missing gateway remains an explicit setup state without an invented live result', async () => {
  await assert.rejects(gatewayRequest({}, 'search', { query: 'Example', type: 'book' }), e => e.kind === 'setup');
});
test('gateway receives only a bounded cultural query and server authorization', async () => {
  const config = { QLOO_GATEWAY_URL: 'https://gateway.example', QLOO_GATEWAY_TOKEN: 'server-only-secret' };
  const result = await gatewayRequest(config, 'insights', { type: 'book', ids: [id], privateBrief: 'never send this' }, async (url, opts) => {
    assert.equal(String(url), 'https://gateway.example/insights');
    assert.equal(opts.headers.authorization, 'Bearer server-only-secret');
    assert.deepEqual(JSON.parse(opts.body), { type: 'book', ids: [id] });
    assert.equal(opts.redirect, 'error');
    return Response.json({ success: true, results: { entities: [{ entity_id: id, name: 'A public book' }] } });
  });
  assert.equal(result.source, 'Qloo'); assert.equal(result.items.length, 1);
  assert.equal(JSON.stringify(result).includes('server-only-secret'), false);
});
test('rate limits, authentication and response corruption have distinct recovery states', async () => {
  const config = { QLOO_GATEWAY_URL: 'https://gateway.example', QLOO_GATEWAY_TOKEN: 'secret' };
  for (const [status, kind] of [[429, 'rate-limit'], [401, 'authentication'], [500, 'service']]) await assert.rejects(gatewayRequest(config, 'search', { query: 'Example', type: 'book' }, async () => new Response('private diagnostics', { status })), e => e.kind === kind && !e.message.includes('private diagnostics'));
  await assert.rejects(gatewayRequest(config, 'search', { query: 'Example', type: 'book' }, async () => new Response('not json')), e => e.kind === 'response');
});
test('a failed provider payload is not mistaken for an empty successful response', async () => {
  await assert.rejects(gatewayRequest({ QLOO_GATEWAY_URL: 'https://gateway.example', QLOO_GATEWAY_TOKEN: 'secret' }, 'search', { query: 'Example', type: 'book' }, async () => Response.json({ success: false })), e => e.kind === 'service');
});
test('different cultural metadata produces different creative treatments and evidence reasons', () => {
  const research = tags => ({mode:'live',groups:[{type:'book',items:[{id,name:'Reference',type:'book',tags}]}]});
  const calm = makeDirections(sampleBrief,research(['mindfulness','quiet']));
  const active = makeDirections(sampleBrief,research(['sport','dance']));
  assert.equal(calm[0].theme,'reflection'); assert.equal(active[0].theme,'energy');
  assert.notEqual(calm[0].script[0].picture,active[0].script[0].picture);
  assert.deepEqual(active[0].evidenceIds,[id]); assert.ok(active[0].matchedSignals.includes('sport'));
});
test('missing metadata stays explicitly exploratory and static formats omit video timestamps', () => {
  const research={groups:[{items:[{id,name:'Unknown context',type:'book'}]}]};
  const directions=makeDirections({...sampleBrief,format:'Social carousel'},research);
  assert.match(directions[0].evidenceBasis,/does not support/);
  assert.equal(directions[0].script[0].time,'Headline');
  assert.equal(directions[0].matchedSignals.length,0);
});
