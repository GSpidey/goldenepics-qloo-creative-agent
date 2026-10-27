import { env } from 'cloudflare:workers';
export const dynamic = 'force-dynamic';
export function GET() {
  const config = env as unknown as Record<string, string>;
  return Response.json({ research: config.QLOO_GATEWAY_URL && config.QLOO_GATEWAY_TOKEN ? 'configured' : 'setup', planner: 'structured', schema: 1 }, { headers: { 'cache-control': 'no-store' } });
}
