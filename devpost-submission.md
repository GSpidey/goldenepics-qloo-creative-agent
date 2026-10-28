# GoldenEpics Qloo Creative Agent

## One-line Summary
Turn a rough business brief into a campaign plan—and see how cultural evidence changes the creative.

## Problem
Small businesses can describe what they sell, but translating their audience's interests into a specific creative direction takes research. Generic campaign templates often skip that connection, leaving teams with plausible ideas and little explanation of why they fit.

## Solution
Bring a campaign brief and public cultural references. Confirm the exact references, let the agent research related books, films and brands through Qloo, and compare three creative treatments. Each direction keeps its supporting entities, the signals used in the interpretation, a practical script or copy structure, production notes and an exportable brief.

## Why This Matters
The target user is a small business owner or independent creative preparing an initial campaign. The product makes the research-to-creative decision visible, portable and open to challenge. Its value is a better-founded starting point; marketing effectiveness still needs testing.

## How We Used AI
Qloo provides cultural intelligence through its event-supported public harness. The application orchestrates exact-entity lookup and bounded cross-domain research, then applies a transparent deterministic creative planner to returned tags and descriptions. It is an agentic research tool, not an LLM text generator. No separate model subscription is required. Fictional sample fixtures remain clearly labeled.

## How We Used Codex
Codex helped implement the React workspace, server adapter, authenticated Node harness gateway, evidence-sensitive planner, exports, tests and Cloudflare deployment. Testing caught a harness output-shape mismatch and a planner that reused treatments regardless of evidence; the current implementation addresses both. Real hosted search and book/movie/brand insights, partial-result recovery, exports and reload persistence have now been verified. Runtime tests also caught an unsupported Workers redirect mode and a missing container attachment during deployment.

## Key Features
- Exact cultural reference confirmation before research.
- Three-domain research with retained partial results and bounded calls.
- Evidence-sensitive treatments and a plain-product comparison.
- Visible distinction between Qloo evidence and creative interpretation.
- Editable notes, device-local persistence and Markdown/JSON exports.
- Server-only credentials, protected gateway, deduplication and durable request ceiling.

## Architecture
React/Vinext workspace → same-origin server route → authenticated Cloudflare Worker/Durable Object → Node container → pinned @qloo/qloo-harness 0.1.26 → Qloo. The product brief stays in the browser; cultural query names or selected entity IDs reach research. The public repository contains the complete scoped application and gateway; the broader commercial Studio is a separate private product and is not a runtime dependency.

## Testing Instructions
See docs/JUDGE_WALKTHROUGH.md and README.md. Tests run without paid calls. The event key is activated; docs/CURRENT_STATE.md records bounded live verification and its limitations.

## Public Demo Link
https://goldenepics-qloo-creative-agent.bamidele-ada-9224.chatgpt.site

The demo is public; signed-out readiness and real hosted research have been verified.

## Public Repository Link
https://github.com/GSpidey/goldenepics-qloo-creative-agent

## Demo Video
Not required by the fetched Qloo submission requirements. Prioritize a functional public demo. Optional walkthrough outline: problem (15s), confirm references (25s), research and evidence (40s), compare treatment to baseline (25s), export (15s).

## Screenshot Shot List
Brief and overview; reference confirmation; compared directions; selected treatment with evidence; exported brief. Use live results only after verification; label any sample screenshots.

## Submission Readiness Notes
Submitted to the Qloo Agentic Hackathon and verified live on October 27, 2026 at 10:00 p.m. Vancouver (October 28 05:00 UTC). Devpost project 1514160; submission 1268630. Public page: https://devpost.com/software/goldenepics-qloo-creative-agent . Registration answers: Working solo; first time using Qloo. Rules, terms and eligibility approval were already recorded in the handoff.

## Known Limitations
Creative interpretation is rule-based. Sparse metadata needs human research. Evidence is aggregate, not personal profiling or a conversion probability. Device-local briefs need export for portability. The service may need time to start after inactivity. No finished video generation or social publication is included in this focused entry.

## Submitted Official Form Fields
Verified against authenticated Qloo requirements on October 27, 2026 (Vancouver).

- 28597 — When did you begin your project? **October 27, 2026. The standalone Qloo implementation began on this date; the broader GoldenEpics Studio concept and RiseQuest advertising work predate it.**
- 28598 — The public URL to your project: **https://goldenepics-qloo-creative-agent.bamidele-ada-9224.chatgpt.site**
- 28599 — Link to your PUBLIC code repo: **https://github.com/GSpidey/goldenepics-qloo-creative-agent**
- 28701 — Existing-project improvements (optional): **New standalone app inspired by our existing Studio: exact Qloo references, cross-domain research, evidence-based treatments, provenance, exports and a server-side harness gateway. Studio stays separate; dependencies and starter are disclosed in the repo.**
