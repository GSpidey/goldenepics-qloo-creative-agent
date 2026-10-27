# GoldenEpics · Qloo Creative Agent

Turn cultural references into a campaign direction you can explain.

A complete, scoped open-source application for the Qloo Agentic Hackathon. Describe a product, confirm cultural references, explore connected books, films and brands, then export a production brief with its evidence and research trail.

**Current status:** interface, structured planner, exports and server gateway implemented. The fictional sample works without credentials. Live Qloo integration is **not yet verified**; event access and gateway hosting are pending. This is a development release, not a completed competition submission.

## Workflow

1. Describe the product, audience, goal, tone and format.
2. Search Qloo and confirm exact cultural entities from candidate matches.
3. Research related books, films and brands with the event-supported Qloo harness.
4. Compare three creative interpretations with evidence links.
5. Select a direction, refine production notes, and export Markdown or JSON.

The planner uses transparent deterministic rules, not an LLM. Qloo supplies cultural intelligence. This app orchestrates bounded research tools and proposes creative hypotheses. It does not generate videos, publish ads, or predict conversions. Scripts currently use a thirty-second scaffold; other format choices carry adaptation guidance.

## Run the sample

Requires Node.js 22.19+ and pnpm 11.25.0. The sample and tests make no provider calls.

```sh
git clone https://github.com/GSpidey/goldenepics-qloo-creative-agent.git
cd goldenepics-qloo-creative-agent
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open the printed URL. Choose **Explore a sample**, select a direction and export the brief. All sample cultural records are original fictional fixtures, labeled throughout. Briefs save on the current device; exports provide a portable copy.

```sh
pnpm test
pnpm typecheck
pnpm build
```

The public hosting manifest omits the author's Site identity. To host your own copy, create a Site, then run `node scripts/set-project-id.mjs --project-id YOUR_SITE_ID`. The private Studio is not needed.

## Live Qloo setup

The event kit supports `qloo explore`, `qloo exec`, `qloo api`, and `qloo mcp`. This application uses **qloo api** inside a trusted Node gateway. The browser never receives the Qloo key. Only a public reference search or selected entity IDs are sent to cultural research; the private product brief stays in the workspace.

1. Register at https://qloo.devpost.com/ and request an event key from its Resources page. Check the actual quota and expiration. Do not paste credentials into a repository, issue, chat, or browser app.
2. Install the gateway:

```sh
cd gateway
npm ci
cp .env.example .env
```

3. Privately set `QLOO_API_KEY` and a separate random `QLOO_GATEWAY_TOKEN` of at least 24 characters in the untracked environment or server secret manager. Leave `BIND_HOST=127.0.0.1` for a same-host reverse proxy.
4. Run `npm start` from `gateway/`. Use an authorized Node host and trusted HTTPS reverse proxy for remote access. Only authenticated `/search`, `/insights` and `/health` routes are implemented.
5. Configure the web app's **server runtime secrets**: `QLOO_GATEWAY_URL` (HTTPS origin) and the matching `QLOO_GATEWAY_TOKEN`. For local Wrangler development use untracked `.dev.vars`. A loopback gateway additionally needs `ALLOW_LOCAL_GATEWAY=1`. A cloud preview cannot reach your laptop's loopback address.
6. Confirm a real entity, run the three-category research, and verify returned names/types and evidence before judging.

The default gateway ceiling is 100 upstream attempts/day per process. This is an app ceiling, not the event quota: adjust downward to the actual allowance. It resets on restart; multi-instance installations need shared quota storage. No model subscription is required. The gateway bounds time/output, avoids a shell, briefly caches, deduplicates identical requests and uses no automatic retry fallback.

### Docker gateway

From the repository root:

```sh
docker build -f gateway/Dockerfile -t goldenepics-qloo-gateway .
docker run --rm --env-file gateway/.env -p 127.0.0.1:8788:8788 goldenepics-qloo-gateway
```

Set `BIND_HOST=0.0.0.0` in the container runtime environment. Keep the host port loopback-only behind HTTPS. Building does not deploy or grant server access.

## Source map

- `app/`: React workspace and server-only research/status routes.
- `lib/creative.mjs`: validation, normalization, planner and exports.
- `lib/gateway.mjs`: bounded server-to-gateway adapter.
- `gateway/`: complete Node service, locked package, Dockerfile and tests.
- `tests/`: provider-boundary and provenance tests with controlled fixtures.
- `docs/CURRENT_STATE.md`: observed state and remaining release work.

## Evidence and limits

Qloo affinities describe aggregate cultural relationships. They do not establish individual preferences, sensitive traits or future behavior. Search candidates require confirmation. Popularity is never relabeled as affinity. Provider evidence and creative interpretation remain distinct. Available research remains usable when another category fails.

References imply neither endorsement nor permission to reuse source imagery, music, logos or likenesses. This repository includes no Qloo source images, private Studio media/customer data, secrets, or private backend dependencies. Fictional fixtures and SVG/CSS art are original project work. Dependencies retain their licenses.

## Release checklist

- [x] Complete independent interface, planner and exports.
- [x] MIT license, locked dependencies, authenticated harness gateway.
- [x] Input, provider-boundary and provenance tests.
- [ ] Successful live Qloo query and response mapping.
- [ ] Hosted gateway and allowance valid through judging.
- [ ] Free judge-accessible demo with live cultural research.
- [ ] Entrant eligibility and Devpost registration confirmed.
- [ ] Final demo materials and official submission.

An author-private development Site does not provide unrestricted judge access. Official requirements: https://qloo.devpost.com/rules . Event kit: https://github.com/qloo/qloo-hackathon-kit .

## Relationship and license

This independently runnable module contributes audience research to GoldenEpics Studio. Its complete scoped source is public; the wider Studio remains private. PayPal Campaign Commerce is separate. MIT; Qloo services remain subject to their own terms.
