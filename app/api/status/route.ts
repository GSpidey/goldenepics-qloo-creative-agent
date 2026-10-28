import { env } from 'cloudflare:workers';
export const dynamic = 'force-dynamic';
export async function GET() {
  const config = env as unknown as Record<string, string>;
  let research = 'setup';
  if (config.QLOO_GATEWAY_URL && config.QLOO_GATEWAY_TOKEN) {
    try {
      // Warm-up is retained by the gateway even if this short status request ends.
      await fetch(new URL('/prepare', config.QLOO_GATEWAY_URL), {method:'POST',headers:{authorization:'Bearer '+config.QLOO_GATEWAY_TOKEN},redirect:'manual',signal:AbortSignal.timeout(8000)});
      const r = await fetch(new URL('/health', config.QLOO_GATEWAY_URL), {headers:{authorization:'Bearer '+config.QLOO_GATEWAY_TOKEN},redirect:'manual',signal:AbortSignal.timeout(12000)});
      const data = r.ok ? await r.json() as {status?:string} : null;
      research = data?.status === 'ready' ? 'configured' : data?.status === 'awaiting_key' ? 'awaiting_key' : 'warming';
    } catch { research = 'warming'; }
  }
  return Response.json({research,planner:'evidence-led structured rules',schema:1},{headers:{'cache-control':'no-store'}});
}
