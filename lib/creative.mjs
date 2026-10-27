export const SCHEMA_VERSION = 1;
export const TYPES = ['brand', 'movie', 'book', 'artist', 'tv_show', 'podcast', 'videogame'];
export const sampleBrief = { product: 'RiseQuest', description: 'A companion app that helps people turn everyday plans into manageable quests.', audience: 'Busy creators looking for a gentler daily routine', goal: 'Try one small quest today', tone: 'Warm and playful', format: '30-second vertical video', refinement: '' };
// Original fictional fixtures for interface testing. These are not Qloo records.
export const sampleSeeds = [
  { id: 'sample:book:small-wonders', name: 'Small Wonders', type: 'book', description: 'Fictional reference: gentle everyday adventures.' },
  { id: 'sample:movie:starlight-garden', name: 'Starlight Garden', type: 'movie', description: 'Fictional reference: a hopeful, imaginative journey.' },
];
export const sampleResearch = {
  mode: 'sample', fetchedAt: '2026-10-27T00:00:00.000Z',
  groups: [
    { type: 'book', items: [{ id: 'sample:evidence:1', name: 'The Little Journey', type: 'book', tags: ['everyday adventure', 'friendship'], description: 'Fictional example of an everyday adventure.' }] },
    { type: 'movie', items: [{ id: 'sample:evidence:2', name: 'A Brighter Morning', type: 'movie', tags: ['hopeful', 'discovery'], description: 'Fictional example of an optimistic discovery story.' }] },
    { type: 'brand', items: [{ id: 'sample:evidence:3', name: 'Paper & Sprout', type: 'brand', tags: ['craft', 'nature'], description: 'Fictional example of a tactile, nature-inspired aesthetic.' }] },
  ],
  trace: [{ step: 'Preview sample', status: 'sample', message: 'Original fictional references demonstrate the workflow. Connect Qloo for live cultural evidence.' }],
};
function text(value, max = 1000) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
export function validateBrief(input) {
  if (!input || typeof input !== 'object') throw new Error('Add a campaign brief to continue.');
  const brief = Object.fromEntries(['product', 'description', 'audience', 'goal', 'tone', 'format', 'refinement'].map(k => [k, text(input[k], k === 'product' ? 100 : 1000)]));
  if (!brief.product || !brief.description || !brief.audience || !brief.goal) throw new Error('Add your product, description, audience and campaign goal.');
  return brief;
}
export function normalizeEntities(payload, type = '') {
  const raw = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : payload?.results?.entities ?? payload?.entities ?? [];
  if (!Array.isArray(raw)) throw new Error('The cultural service returned an unexpected response.');
  return raw.slice(0, 12).filter(e => typeof e?.name === 'string' && typeof (e?.entity_id ?? e?.id) === 'string').map(e => ({
    id: e.entity_id ?? e.id, name: text(e.name, 200), type: text(e.subtype ?? e.type ?? type, 100).replace('urn:entity:', ''),
    description: text(e.properties?.description ?? e.description ?? e.disambiguation, 700),
    tags: (Array.isArray(e.tags) ? e.tags : []).slice(0, 12).map(t => text(typeof t === 'string' ? t : t.name, 100)).filter(Boolean),
    // A popularity value is never substituted for affinity.
    ...(typeof e.query?.affinity === 'number' ? { affinity: e.query.affinity } : {}),
  }));
}
export function validateSelection(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 5) throw new Error('Choose between one and five cultural references.');
  const ids = [...new Set(input)];
  if (ids.some(id => typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) throw new Error('Choose references from the Qloo search results.');
  return ids;
}
export function makeDirections(input, research) {
  const brief = validateBrief(input);
  const evidence = (research?.groups ?? []).flatMap(g => g.items ?? []);
  if (!evidence.length) return [];
  const tracks = [
    { label: 'The small adventure', lens: 'A manageable beginning', color: 'peach', scene: 'Open on an everyday task that feels larger than life. Move closer until one small, achievable action fills the frame.', hook: 'Every adventure starts smaller than you think.', visual: 'Tactile props, warm daylight, a slow reveal and one clear focal point.' },
    { label: 'A little company', lens: 'Connection over perfection', color: 'lavender', scene: 'A character meets the same small obstacle as the viewer. A friendly moment turns the task into something they can approach together.', hook: 'A little company can change the shape of your day.', visual: 'An intimate two-character scene, soft contrast and room for a warm reaction.' },
    { label: 'Make room for possibility', lens: 'An imaginative transformation', color: 'mint', scene: 'Start with a familiar desk or daily ritual. Let a playful visual transformation reveal a different way to begin.', hook: 'What could one small change make possible?', visual: 'A simple before-and-after composition, nature-inspired details and a restrained transition.' },
  ];
  return tracks.map((track, i) => {
    const refs = [evidence[i % evidence.length], evidence[(i + 1) % evidence.length]].filter((v, n, all) => all.findIndex(x => x.id === v.id) === n);
    const tags = [...new Set(refs.flatMap(e => e.tags))].slice(0, 4);
    return {
      id: 'direction-' + (i + 1), ...track,
      title: `${brief.product}: ${track.label.toLowerCase()}`,
      rationale: `Explore ${tags.length ? tags.join(', ') : 'the selected cultural references'} through “${track.lens.toLowerCase()}”. This is a creative hypothesis to test with ${brief.audience.toLowerCase()}.`,
      evidenceIds: refs.map(e => e.id),
      evidenceNames: refs.map(e => e.name),
      script: [
        { time: '0–5s', voice: track.hook, picture: track.scene },
        { time: '5–15s', voice: `Meet ${brief.product}. ${brief.description}`, picture: `Show the real product doing one useful thing for ${brief.audience.toLowerCase()}.` },
        { time: '15–25s', voice: 'Find your starting point. Make it your own.', picture: 'Let the viewer read the product action and its visible result. Use verified product footage.' },
        { time: '25–30s', voice: brief.goal, picture: `End with ${brief.product}, one clear call to action and a verified destination link.` },
      ],
      productionNotes: `${track.visual} Voice direction: ${brief.tone || 'warm and clear'}. Target format: ${brief.format || '30-second video'}. Adapt scene durations to the final narration. ${brief.refinement ? `Revision request: ${brief.refinement}` : ''}`.trim(),
      test: `Compare the opening hook with a plain product demonstration. Measure completed views and qualified clicks; treat the cultural connection as a hypothesis.`,
      interpretation: 'Structured creative interpretation, not a Qloo recommendation of an ad or a prediction of campaign performance.',
    };
  });
}
export function makeExport(brief, seeds, research, selected) {
  const directions = makeDirections(brief, research);
  return { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), source: research.mode === 'live' ? 'Qloo live results + structured creative interpretation' : 'Fictional sample + structured creative interpretation', brief: validateBrief(brief), references: seeds, research, selectedDirection: directions.find(d => d.id === selected) ?? null, directions, limits: 'Aggregate cultural affinities suggest creative research directions. They are not individual preferences, causal claims, or conversion probabilities. References imply no endorsement; source imagery, logos and copyrighted material require separate permission.' };
}
export function toMarkdown(doc) {
  const e = s => String(s ?? '').replace(/[\r\n]+/g, ' ');
  return [`# ${e(doc.brief.product)} · Campaign brief`, `Source: ${doc.source}`, `Exported: ${doc.exportedAt}`, `## Campaign`, `Audience: ${e(doc.brief.audience)}`, `Product: ${e(doc.brief.description)}`, `Goal: ${e(doc.brief.goal)}`, `## Cultural references`, ...doc.references.map(r => `- ${e(r.name)} (${e(r.type)}); ID: ${e(r.id)}`), `## Evidence`, ...doc.research.groups.flatMap(g => g.items.map(r => `- ${e(r.name)} (${e(r.type)}); ID: ${e(r.id)}; tags: ${(r.tags ?? []).map(e).join(', ')}`)), `## ${doc.selectedDirection ? 'Selected direction' : 'Creative directions'}`, ...(doc.selectedDirection ? [doc.selectedDirection] : doc.directions).flatMap(d => [`### ${e(d.title)}`, e(d.rationale), `Evidence: ${d.evidenceNames.map(e).join(', ')}`, ...d.script.map(s => `- ${s.time}: ${e(s.voice)} / Visual: ${e(s.picture)}`), e(d.productionNotes), `Test: ${e(d.test)}`]), `## Limits and provenance`, doc.limits, `Creative planning uses a transparent deterministic planner. No language model or media generation is claimed.`, `Qloo retrieved: ${doc.research.fetchedAt}`, `## Tool trace`, ...doc.research.trace.map(t => `- ${e(t.step)}: ${e(t.status)}. ${e(t.message)}`)].join('\n\n');
}
