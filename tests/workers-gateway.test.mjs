import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { Miniflare } = require(require.resolve('miniflare', { paths: [require.resolve('wrangler')] }));

test('actual Workers runtime sends bounded gateway requests and refuses redirects', async t => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  let redirect = false;
  const seen = [];
  const mf = new Miniflare({
    compatibilityDate: '2026-05-15',
    modules: [
      { type: 'ESModule', path: root + 'test-worker.mjs', contents: `
        import { gatewayRequest } from './lib/gateway.mjs';
        export default { async fetch() {
          try { return Response.json(await gatewayRequest({QLOO_GATEWAY_URL:'https://gateway.example',QLOO_GATEWAY_TOKEN:'fixture-only-token'},'search',{query:'Example',type:'book'})); }
          catch (e) { return Response.json({kind:e.kind},{status:e.status||500}); }
        }};
      ` },
      ...await Promise.all(['lib/gateway.mjs', 'lib/creative.mjs'].map(async path => ({type:'ESModule',path:root+path,contents:await readFile(root+path,'utf8')})))
    ],
    outboundService: async request => {
      seen.push({url:request.url,authorization:request.headers.get('authorization'),body:await request.json()});
      if (redirect) return new Response(null,{status:302,headers:{location:'https://untrusted.example'}});
      return Response.json({success:true,results:{entities:[{entity_id:'12345678-abcd-1234-abcd-123456789abc',name:'Public fixture'}]}});
    }
  });
  t.after(() => mf.dispose());
  const ok = await mf.dispatchFetch('http://localhost/');
  assert.equal(ok.status,200);
  assert.equal((await ok.json()).items.length,1);
  redirect=true;
  const failed = await mf.dispatchFetch('http://localhost/');
  assert.equal(failed.status,503);
  assert.equal((await failed.json()).kind,'service');
  assert.equal(seen.length,2);
  for (const request of seen) {
    assert.equal(request.url,'https://gateway.example/search');
    assert.equal(request.authorization,'Bearer fixture-only-token');
    assert.deepEqual(request.body,{query:'Example',type:'book'});
  }
});
