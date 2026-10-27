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
  const themes = [
    { key: 'discovery', label: 'A small discovery', lens: 'Curiosity creates a starting point', words: ['adventure', 'discovery', 'exploration', 'fantasy', 'wonder', 'journey'], hook: 'What might you discover next?', scene: 'Reveal the product one useful detail at a time, ending with a small discovery.', visual: 'A slow reveal, inviting close-ups and a sense of exploration.' },
    { key: 'connection', label: 'Better together', lens: 'Shared moments make it meaningful', words: ['friendship', 'family', 'community', 'romance', 'together', 'social'], hook: 'Some things are better shared.', scene: 'Show two people finding a shared moment through the product.', visual: 'Paired compositions, warm reactions and a conversational rhythm.' },
    { key: 'craft', label: 'Made with intention', lens: 'Let the details tell the story', words: ['craft', 'design', 'art', 'handmade', 'fashion', 'creative'], hook: 'The little details make the difference.', scene: 'Follow the making or use of one detail that demonstrates the product’s value.', visual: 'Tactile textures, deliberate close-ups and a restrained layout.' },
    { key: 'nature', label: 'A breath of possibility', lens: 'Bring the outside into an everyday moment', words: ['nature', 'outdoor', 'garden', 'environment', 'wildlife', 'sustainable'], hook: 'Make space for a fresh perspective.', scene: 'Use an original outdoor-inspired setting to frame a practical product moment.', visual: 'Natural textures, open compositions and gentle movement.' },
    { key: 'energy', label: 'Find your momentum', lens: 'Build energy around a useful action', words: ['sport', 'action', 'dance', 'fitness', 'electronic', 'competition'], hook: 'Find the moment that moves you.', scene: 'Build a sequence of short actions toward a clear product result.', visual: 'Rhythmic cuts, bold contrast and a single visible result.' },
    { key: 'reflection', label: 'A moment to yourself', lens: 'Give a thoughtful choice room to breathe', words: ['calm', 'mindfulness', 'reflect', 'quiet', 'philosophy', 'wellness'], hook: 'Take a moment. Make it yours.', scene: 'Let a quiet everyday ritual lead naturally into the product demonstration.', visual: 'Unhurried pacing, soft contrast and generous negative space.' },
    { key: 'play', label: 'A delightful surprise', lens: 'Make the familiar feel playful', words: ['comedy', 'humor', 'play', 'animation', 'fun', 'whimsical'], hook: 'Who said everyday had to be ordinary?', scene: 'Stage one original playful surprise, then resolve it through a real product action.', visual: 'A playful prop, a clear visual payoff and light comic timing.' },
  ];
  // Vocabulary matching is a disclosed creative heuristic, never a Qloo-generated theme.
  const ranked = themes.map(theme => {
    const matches = evidence.map(entity => {
      const source = [...(entity.tags ?? []), entity.description ?? ''].join(' ').toLowerCase();
      const matched = theme.words.filter(word => new RegExp('\\b' + word + '\\w*', 'i').test(source));
      return { entity, matched };
    }).filter(match => match.matched.length);
    return { ...theme, matches, score: matches.reduce((sum, match) => sum + match.matched.length, 0) };
  }).filter(theme => theme.score > 0).sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  const tracks = ranked.slice(0, 3);
  // If metadata cannot support three treatments, show reference-led explorations honestly.
  for (let i = tracks.length; i < 3; i++) {
    const entity = evidence[i % evidence.length];
    tracks.push({ key: 'reference-' + i, label: `Explore ${entity.name}`, lens: `A reference-led exploration`, matches: [{ entity, matched: [] }], score: 0,
      hook: `A new perspective on ${brief.product}.`, scene: `Research the context of “${entity.name}”, then develop an original product scene. Confirm the creative link before production.`, visual: 'Use original product imagery. Research the reference’s context before choosing a visual treatment.' });
  }
  const colors = ['peach', 'lavender', 'mint'];
  return tracks.map((track, i) => {
    const refs = track.matches.map(match => match.entity).filter((value, index, all) => all.findIndex(x => x.id === value.id) === index).slice(0, 3);
    const matched = [...new Set(track.matches.flatMap(match => match.matched))];
    const basis = matched.length ? `Research metadata includes ${matched.join(', ')}. Our disclosed theme rules translate those signals into this treatment.` : `The returned reference is available, but its metadata does not support a specific theme. This direction needs human research before production.`;
    const format = brief.format || '30-second vertical video';
    const video = format.includes('video');
    const short = format.includes('15');
    const script = video ? [
      { time: short ? '0–3s' : '0–5s', voice: track.hook, picture: track.scene },
      { time: short ? '3–8s' : '5–15s', voice: `Meet ${brief.product}. ${brief.description}`, picture: `Show the product helping ${brief.audience.toLowerCase()}. Demonstrate only verified capabilities.` },
      { time: short ? '8–12s' : '15–25s', voice: 'See what it can do for you.', picture: 'Show one readable product action and its visible result.' },
      { time: short ? '12–15s' : '25–30s', voice: brief.goal, picture: `End with ${brief.product} and a verified destination link.` },
    ] : [
      { time: 'Headline', voice: track.hook, picture: track.scene },
      { time: 'Body', voice: `Meet ${brief.product}. ${brief.description}`, picture: 'One original product image and one substantiated benefit.' },
      { time: 'Call to action', voice: brief.goal, picture: 'Readable brand name and a verified destination link.' },
    ];
    return {
      id: 'direction-' + (i + 1), label: track.label, lens: track.lens, color: colors[i], theme: track.key,
      title: `${brief.product}: ${track.label.toLowerCase()}`,
      rationale: `${basis} Test its relevance with ${brief.audience.toLowerCase()}.`,
      evidenceIds: refs.map(e => e.id), evidenceNames: refs.map(e => e.name), matchedSignals: matched,
      evidenceBasis: basis,
      baseline: `Show ${brief.product}, explain its practical value, and invite the viewer to: ${brief.goal}.`,
      culturalChange: `${track.scene} ${matched.length ? 'Selected because of the metadata signals above.' : 'An exploratory reference, not a verified creative fit.'}`,
      script,
      productionNotes: `${track.visual} Voice direction: ${brief.tone || 'warm and clear'}. Target format: ${format}. ${brief.refinement ? `Revision request: ${brief.refinement}` : ''}`.trim(),
      test: 'Compare this treatment with the plain product demonstration using the same audience, offer and placement. Evaluate completed views and qualified clicks; no uplift is claimed before testing.',
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
  return [`# ${e(doc.brief.product)} · Campaign brief`, `Source: ${doc.source}`, `Exported: ${doc.exportedAt}`, `## Campaign`, `Audience: ${e(doc.brief.audience)}`, `Product: ${e(doc.brief.description)}`, `Goal: ${e(doc.brief.goal)}`, `## Cultural references`, ...doc.references.map(r => `- ${e(r.name)} (${e(r.type)}); ID: ${e(r.id)}`), `## Evidence`, ...doc.research.groups.flatMap(g => g.items.map(r => `- ${e(r.name)} (${e(r.type)}); ID: ${e(r.id)}; tags: ${(r.tags ?? []).map(e).join(', ')}`)), `## ${doc.selectedDirection ? 'Selected direction' : 'Creative directions'}`, ...(doc.selectedDirection ? [doc.selectedDirection] : doc.directions).flatMap(d => [`### ${e(d.title)}`, e(d.rationale), `Evidence: ${d.evidenceNames.map(e).join(', ')}`, `Without cultural research: ${e(d.baseline)}`, `What the evidence changes: ${e(d.culturalChange)}`, ...d.script.map(s => `- ${s.time}: ${e(s.voice)} / Visual: ${e(s.picture)}`), e(d.productionNotes), `Test: ${e(d.test)}`]), `## Limits and provenance`, doc.limits, `Creative planning uses a transparent deterministic planner. No language model or media generation is claimed.`, `Qloo retrieved: ${doc.research.fetchedAt}`, `## Tool trace`, ...doc.research.trace.map(t => `- ${e(t.step)}: ${e(t.status)}. ${e(t.message)}`)].join('\n\n');
}
