import { env } from 'cloudflare:workers';
import { gatewayRequest, ServiceError } from '@/lib/gateway.mjs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ message: 'Open the campaign workspace to continue.' }, { status: 403 });
  if (Number(request.headers.get('content-length') || 0) > 6000) return Response.json({ message: 'Use a shorter research request.' }, { status: 413 });
  try {
    const raw = await request.text();
    if (raw.length > 6000) return Response.json({ message: 'Use a shorter research request.' }, { status: 413 });
    let data;
    try { data = JSON.parse(raw); } catch { return Response.json({ message: 'Check the research request and try again.' }, { status: 400 }); }
    return Response.json(await gatewayRequest(env as unknown as Record<string, string>, data.operation, data), { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    const known = error instanceof ServiceError;
    return Response.json({ message: known ? error.message : 'Cultural research is unavailable. Your workspace remains ready to use.', kind: known ? error.kind : 'service' }, { status: known ? error.status : 503 });
  }
}
