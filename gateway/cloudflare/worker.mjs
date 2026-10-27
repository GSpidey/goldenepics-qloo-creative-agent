import { DurableObject } from 'cloudflare:workers';
import bootstrap from './bootstrap.generated.mjs';
const reply=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store'}});
export class QlooGateway extends DurableObject {
  starting=null;
  async start() {
    const container=this.ctx.container;
    if(!container.running) container.start({image:'cloudflare/debian-trixie',instance:'lite',enableInternet:true,entrypoint:['node','-e',bootstrap],env:{QLOO_GATEWAY_TOKEN:this.env.QLOO_GATEWAY_TOKEN,QLOO_API_KEY:this.env.QLOO_API_KEY||'',QLOO_DAILY_MAX_CALLS:this.env.QLOO_DAILY_MAX_CALLS||'100',BIND_HOST:'0.0.0.0',PORT:'8788'}});
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
    catch{return reply({error:'gateway_start_pending'},503);}
  }
}
export default {async fetch(request,env){
  const expected=env.QLOO_GATEWAY_TOKEN;
  if(!expected||expected.length<24||request.headers.get('authorization')!=='Bearer '+expected)return reply({error:'gateway_access_required'},401);
  const path=new URL(request.url).pathname;
  if(!((request.method==='GET'&&path==='/health')||(request.method==='POST'&&['/search','/insights','/prepare','/restart'].includes(path))))return reply({error:'unsupported_operation'},404);
  const id=env.GATEWAY.idFromName('qloo-single-gateway');return env.GATEWAY.get(id).fetch(request);
}};
