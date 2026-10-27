// Manual live verification: exactly two bounded read calls, no automatic retries.
import { gatewayRequest } from '../lib/gateway.mjs';
const config=process.env;
try {
 const search=await gatewayRequest(config,'search',{query:config.QLOO_SMOKE_QUERY||'The Little Prince',type:'book'});
 const entity=search.items[0];if(!entity)throw new Error('Search returned no candidates; choose another public reference.');
 const insights=await gatewayRequest(config,'insights',{ids:[entity.id],type:'book'});
 if(!insights.items.length)throw new Error('Search passed, but this reference returned no book connections. Review before judging.');
 console.log(JSON.stringify({verifiedAt:new Date().toISOString(),candidate:{id:entity.id,name:entity.name},connections:insights.items.map(e=>({id:e.id,name:e.name,type:e.type})),calls:2,credentialPrinted:false},null,2));
} catch(error) {console.error(error.message);process.exitCode=1;}
