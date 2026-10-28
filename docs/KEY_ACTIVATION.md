# Final key activation and judging check

The Node harness gateway is deployed separately on Cloudflare as `goldenepics-qloo-gateway`. The application uses server-held gateway credentials; these are already configured in Sites. No key belongs in GitHub or the browser. The event API endpoint is `https://hackathon.api.qloo.com`; the deployed Worker explicitly supplies both `QLOO_BASE_URL` and `QLOO_TRUSTED_BASE_URL` to the harness container. Local gateway development must set these as shown in `gateway/.env.example`.

1. In Cloudflare Workers → goldenepics-qloo-gateway → Settings → Variables and Secrets, add `QLOO_API_KEY` as an encrypted secret. Use the event-issued key only. Set `QLOO_DAILY_MAX_CALLS` to at most the confirmed event allowance (current application ceiling: 100/day).
2. Redeploy the Worker with the existing code and secrets, then restart its container through the authenticated `/restart` route. This prevents a warm container from keeping the previous environment. The token stays in protected configuration.
3. Use authenticated `POST /prepare` to warm the gateway; `GET /health` must return `ready`. Health does not call Qloo and does not prove the credential works.
4. Run `node gateway/smoke.mjs` with `QLOO_GATEWAY_URL` and `QLOO_GATEWAY_TOKEN` set in the terminal environment. It makes one bounded search and one book-insights call, stopping on error, and prints only an evidence summary. Default search: The Little Prince; optionally supply a different public reference in `QLOO_SMOKE_QUERY`. Check the returned candidate before interpreting it; the smoke test uses the first candidate only for a protocol check.
5. In the hosted app, enter a brief, search for a known cultural reference, select the intended entity, research connections, choose a direction, export Markdown and JSON, reload and verify saved work.
6. Verify the demo as a signed-out visitor. The owner already authorized public Qloo access and the Site is public (revision 2). Live research must work; a sample-only deployment is not enough.
7. Confirm Devpost registration and entrant eligibility, review the prepared description and field answers, then authorize final submission. Record the returned project URL only after submission succeeds.

## Recovery

A missing key keeps editing, samples and exports available. Authentication, allowance and connection failures remain distinct in server handling. Preserve completed category results when another category fails. Do not rerun successful requests just to improve a progress report. Qloo availability through the judging period must be checked against the actual event key expiry.

The durable gateway ceiling survives container restarts. It conservatively counts authenticated research attempts including cached calls; it is an application protection and not a statement of Qloo billing. Container compute uses the existing Cloudflare account. Sleep occurs after 15 minutes of inactivity; the first request after sleep may need a warm-up retry.
