import { DurableObject } from 'cloudflare:workers';
import bootstrap from './bootstrap.generated.mjs';
const reply=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store'}});
export class QlooGateway extends DurableObject {
  starting=null;
  async start() {
    const container=this.ctx.container;
    if(!container){
      if(!await this.ctx.storage.get('bindingRecovery20261028')){await this.ctx.storage.put('bindingRecovery20261028',true);this.ctx.abort('Reload container binding after deployment');}
      throw new Error('gateway_container_binding_missing');
    }
    const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(bootstrap+'|'+(this.env.QLOO_API_KEY||'')+'|'+this.env.QLOO_GATEWAY_TOKEN+'|runtime-2'))),v=>v.toString(16).padStart(2,'0')).join('');
    if(container.running&&await this.ctx.storage.get('runtimeFingerprint')!==fingerprint)await container.destroy();
    // The event-issued credential is scoped to the hackathon API. Keep the
    // destination fixed here so an unrelated runtime setting cannot redirect it.
    if(!container.running) {
      container.start({image:'cloudflare/debian-trixie',instance:{vcpu:0.25,memoryMib:512,diskMb:2000},enableInternet:true,entrypoint:['node','-e',bootstrap],env:{QLOO_GATEWAY_TOKEN:this.env.QLOO_GATEWAY_TOKEN,QLOO_API_KEY:this.env.QLOO_API_KEY||'',QLOO_BASE_URL:'https://hackathon.api.qloo.com',QLOO_TRUSTED_BASE_URL:'https://hackathon.api.qloo.com',QLOO_DAILY_MAX_CALLS:this.env.QLOO_DAILY_MAX_CALLS||'100',BIND_HOST:'0.0.0.0',PORT:'8788'}});
      await this.ctx.storage.put('runtimeFingerprint',fingerprint);
    }
    await container.setInactivityTimeout(15*60*1000);
    // Readiness retries only contact our own container, never Qloo.
    for(let n=0;n<50;n++){
      try { const r=await container.getTcpPort(8788).fetch(new Request('http://container/health',{headers:{authorization:'Bearer '+this.env.QLOO_GATEWAY_TOKEN}}));if(r.ok)return; }catch{}
      await new Promise(r=>setTimeout(r,2000));
    }
    throw new Error('gateway_start_pending');
  }
  async fetch(request) {
    const path=new URL(request.url).pathname;
    if(path==='/restart'&&request.method==='POST') {if(this.ctx.container.running)await this.ctx.container.destroy();this.starting=null;return reply({status:'restart_ready'});}
    if(path==='/prepare'&&request.method==='POST') {this.starting??=this.start().finally(()=>{this.starting=null;});this.ctx.waitUntil(this.starting.catch(()=>{}));return reply({status:'preparing'},202);}
    if(!['/health','/search','/insights'].includes(path))return reply({error:'unsupported_operation'},404);
    if(path!=='/health'&&!this.env.QLOO_API_KEY)return reply({error:'qloo_key_pending'},503);
    if(path!=='/health'){
      // Durable daily ceiling survives container sleep and Worker restarts.
      const day=new Date().toISOString().slice(0,10);const limit=Math.min(1000,Math.max(1,Number(this.env.QLOO_DAILY_MAX_CALLS)||100));
      const allowed=await this.ctx.storage.transaction(async txn=>{const saved=await txn.get('allowance');const count=saved?.day===day?saved.count:0;if(count>=limit)return false;await txn.put('allowance',{day,count:count+1});return true;});
      if(!allowed)return reply({error:'gateway_request_allowance'},429);
    }
    try{this.starting??=this.start().finally(()=>{this.starting=null;});await this.starting;const url=new URL(request.url);url.protocol='http:';url.host='container';return await this.ctx.container.getTcpPort(8788).fetch(new Request(url,request));}
    catch(error){const detail=String(error?.message||'unknown').replaceAll(this.env.QLOO_API_KEY||'__absent_key__','[redacted]').replaceAll(this.env.QLOO_GATEWAY_TOKEN||'__absent_token__','[redacted]').slice(0,400);console.error(JSON.stringify({event:'gateway_forward_failed',detail}));return reply({error:'gateway_start_pending'},503);}
  }
}
export default {async fetch(request,env){
  const expected=env.QLOO_GATEWAY_TOKEN;
  if(!expected||expected.length<24||request.headers.get('authorization')!=='Bearer '+expected)return reply({error:'gateway_access_required'},401);
  const path=new URL(request.url).pathname;
  if(!((request.method==='GET'&&path==='/health')||(request.method==='POST'&&['/search','/insights','/prepare','/restart'].includes(path))))return reply({error:'unsupported_operation'},404);
  const id=env.GATEWAY.idFromName('qloo-single-gateway');return env.GATEWAY.get(id).fetch(request);
}};
