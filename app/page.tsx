'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, Check, ChevronRight, CircleHelp, Compass, ExternalLink, FileText, Layers3, LoaderCircle, Plus, RotateCcw, Search, Sparkles, Waypoints, X } from 'lucide-react';
import { makeDirections, makeExport, sampleBrief, sampleResearch, sampleSeeds, toMarkdown, TYPES, validateBrief } from '@/lib/creative.mjs';

type Entity = { id: string; name: string; type: string; description?: string; tags?: string[]; affinity?: number };
type Trace = { step: string; status: string; message: string };
type Research = { mode: string; fetchedAt: string; groups: { type: string; items: Entity[] }[]; trace: Trace[] };
const initialBrief = { product: '', description: '', audience: '', goal: '', tone: 'Warm and playful', format: '30-second vertical video', refinement: '' };
const STORAGE = 'goldenepics-qloo-workspace-v1';

function TasteMap() {
  return <svg viewBox="0 0 480 255" role="img" aria-label="Cultural references connect books, film and brands to a campaign direction" className="taste-map">
    <defs><pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#cfcabf" /></pattern></defs>
    <rect width="480" height="255" fill="url(#dots)" opacity=".65" />
    <g fill="none" stroke="#b2b6a8" strokeWidth="1.5"><path d="M94 60 Q230 24 274 124 T422 70"/><path d="M85 194 Q186 225 274 124 T382 215"/><path d="M274 124 Q130 130 94 60"/></g>
    <g transform="translate(35 32)"><rect width="120" height="57" rx="15" fill="#e7e6fa" stroke="#c9c5e7"/><text x="17" y="24" fontSize="11" fill="#6a6285">BOOKS & STORIES</text><text x="17" y="42" fontSize="13" fill="#383343">A sense of wonder</text></g>
    <g transform="translate(29 167)"><rect width="130" height="57" rx="15" fill="#e5eddf" stroke="#bbcdb2"/><text x="17" y="24" fontSize="11" fill="#61725b">BRANDS & DESIGN</text><text x="17" y="42" fontSize="13" fill="#35452f">Everyday rituals</text></g>
    <g transform="translate(340 41)"><rect width="117" height="56" rx="15" fill="#f9e1ce" stroke="#ddbfa6"/><text x="16" y="24" fontSize="11" fill="#956c4b">FILM & CULTURE</text><text x="16" y="42" fontSize="13" fill="#66482f">A fresh perspective</text></g>
    <circle cx="274" cy="124" r="49" fill="#f3b691" opacity=".2"/><circle cx="274" cy="124" r="35" fill="#f9f5ec" stroke="#c67649" strokeWidth="1.5"/><path d="M274 106 L279 119 L292 124 L279 129 L274 142 L269 129 L256 124 L269 119 Z" fill="#bb653c"/>
    <g transform="translate(327 193)"><rect width="117" height="36" rx="18" fill="#293b35"/><text x="58" y="23" fontSize="12" fill="#fff" textAnchor="middle">Your next idea ↗</text></g>
    <text x="230" y="184" fontSize="10" fill="#77756f">ILLUSTRATIVE TASTE CONNECTIONS</text>
  </svg>;
}

export default function Home() {
  const [brief, setBrief] = useState(initialBrief);
  const [seeds, setSeeds] = useState<Entity[]>([]);
  const [research, setResearch] = useState<Research | null>(null);
  const [selected, setSelected] = useState('');
  const [tab, setTab] = useState('brief');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('book');
  const [results, setResults] = useState<Entity[]>([]);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [connection, setConnection] = useState('checking');
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState('Saved on this device');
  const [showHelp, setShowHelp] = useState(false);
  const requestVersion = useRef(0);
  const output = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE);
      if (saved) {
        const doc = JSON.parse(saved);
        if (doc.schemaVersion === 1 && doc.brief && Array.isArray(doc.seeds)) {
          setBrief({ ...initialBrief, ...doc.brief }); setSeeds(doc.seeds.slice(0, 5));
          if (doc.research && Array.isArray(doc.research.groups) && Array.isArray(doc.research.trace)) setResearch(doc.research);
          setSelected(typeof doc.selected === 'string' ? doc.selected : '');
        }
      }
    } catch { setSaveState('Export a copy to keep your work'); }
    setReady(true);
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let checks = 0;
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/status');
        const data = await response.json() as { research: string };
        if (stopped) return;
        setConnection(data.research);
        // Only readiness is retried; this never repeats a Qloo research call.
        if (data.research === 'warming' && ++checks < 8) timer = setTimeout(checkConnection, 15000);
      } catch { if (!stopped) setConnection('setup'); }
    };
    void checkConnection();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE, JSON.stringify({ schemaVersion: 1, brief, seeds, research, selected })); setSaveState('Saved on this device'); }
    catch { setSaveState('Export a copy to keep your work'); }
  }, [brief, seeds, research, selected, ready]);

  let directions: ReturnType<typeof makeDirections> = [];
  try { if (research) directions = makeDirections(brief, research); } catch { /* incomplete brief remains editable */ }
  const active = directions.find(d => d.id === selected);
  const evidence = research?.groups.flatMap(g => g.items) ?? [];
  const change = (key: string, value: string) => setBrief(prev => ({ ...prev, [key]: value }));
  function useSample() {
    requestVersion.current++; setBusy(''); setBrief({ ...sampleBrief }); setSeeds([...sampleSeeds]); setResearch(structuredClone(sampleResearch));
    setSelected(''); setTab('ideas'); setNotice('Sample workspace loaded. All cultural references here are fictional examples.');
    setResults([]);
  }
  function updateSeeds(next: Entity[]) {
    requestVersion.current++; setBusy(''); setSeeds(next); setResearch(null); setSelected('');
  }
  async function api(operation: string, body: object) {
    const response = await fetch('/api/research', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation, ...body }) });
    const data = await response.json() as { items: Entity[]; message?: string; kind?: string; cached?: boolean };
    if (!response.ok) throw Object.assign(new Error(data.message || 'Research is taking a little longer. Try again shortly.'), {kind:data.kind});
    setConnection('configured');
    return data;
  }
  async function search() {
    if (busy) return;
    if (query.trim().length < 2) { setNotice('Enter at least two letters to search for a cultural reference.'); return; }
    const version = ++requestVersion.current; setBusy('search'); setNotice(''); setResults([]);
    try { const data = await api('search', { query: query.trim(), type }); if (version !== requestVersion.current) return; setResults(data.items); if (!data.items.length) setNotice('Try another name or category to find a matching reference.'); }
    catch (e) { if (version === requestVersion.current) setNotice((e as Error).message); }
    finally { if (version === requestVersion.current) setBusy(''); }
  }
  async function runResearch() {
    if (busy) return;
    try { validateBrief(brief); } catch (e) { setNotice((e as Error).message); setTab('brief'); return; }
    if (!seeds.length) { setNotice('Choose at least one reference, or explore the sample workspace.'); setTab('taste'); return; }
    if (seeds.some(s => s.id.startsWith('sample:'))) { setNotice('Sample references are fictional. Remove them and choose real Qloo search results for live research.'); setTab('taste'); return; }
    const version = ++requestVersion.current; setBusy('research'); setNotice('');
    const next: Research = { mode: 'live', fetchedAt: new Date().toISOString(), groups: research?.mode === 'live' ? [...research.groups] : [], trace: [] };
    // One small request per category. Completed categories survive a partial outage.
    for (const category of ['book', 'movie', 'brand']) {
      if (version !== requestVersion.current) return;
      const rejected = research?.trace.find(t => t.step === `Find ${category} connections` && t.status === 'change-reference');
      if(rejected){next.trace.push(rejected);continue;}
      const retained = next.groups.find(g => g.type === category);
      if (retained?.items.length) { next.trace.push({ step: `Find ${category} connections`, status: 'retained', message: `Kept ${retained.items.length} available Qloo results from ${research?.fetchedAt}.` }); continue; }
      try {
        const data = await api('insights', { ids: seeds.map(s => s.id), type: category });
        if (version !== requestVersion.current) return;
        next.groups = [...next.groups.filter(g => g.type !== category), { type: category, items: data.items }];
        next.trace.push({ step: `Find ${category} connections`, status: data.items.length ? 'complete' : 'empty', message: `${data.items.length} Qloo results${data.cached ? ' from the short-lived cache' : ''}.` });
      } catch (e) { next.trace.push({ step: `Find ${category} connections`, status: (e as Error & {kind?:string}).kind === 'reference' ? 'change-reference' : 'retry', message: (e as Error).message }); }
    }
    if (version !== requestVersion.current) return;
    if (next.groups.some(g => g.items.length)) {
      setResearch(next); setSelected(''); setTab('ideas'); setNotice(next.trace.some(t => t.status === 'change-reference') ? 'Your available research is ready. The research trail shows which category needs another reference.' : next.trace.some(t => t.status === 'retry') ? 'Your available research is ready. You can work with it and retry the other categories later.' : 'Cultural research is ready. Compare three creative interpretations below.');
      output.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else setNotice(next.trace.find(t => ['retry','change-reference'].includes(t.status))?.message || 'Try different references to find more cultural connections.');
    setBusy('');
  }
  function download(format: 'json' | 'md') {
    if (!research) { setNotice('Explore the sample or run cultural research to prepare your campaign export.'); return; }
    try {
      const doc = makeExport(brief, seeds, research, selected);
      const blob = new Blob([format === 'json' ? JSON.stringify(doc, null, 2) : toMarkdown(doc)], { type: format === 'json' ? 'application/json' : 'text/markdown' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
      a.download = `${brief.product.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) || 'campaign'}-creative-brief.${format}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('Your campaign brief has been exported with its references, evidence and tool trace.');
    } catch (e) { setNotice((e as Error).message); }
  }

  return <div className="app-shell">
    <header className="header"><a className="brand" href="/" aria-label="GoldenEpics Creative Agent home"><span className="brand-symbol">g<span>✦</span></span><span>GoldenEpics<span className="brand-sub">CREATIVE AGENT</span></span></a><div className="header-middle"><span className="mini-dot"/> A little more culture. A lot more possibility.</div><button className="quiet" onClick={() => setShowHelp(!showHelp)}><CircleHelp size={17}/><span>How it works</span></button></header>
    <main>
      <div className="breadcrumb">WORKSPACE <ChevronRight size={12}/> CULTURAL CAMPAIGN PLANNING</div>
      <section className="hero"><div><div className="eyebrow"><span/> CONNECT THE DOTS</div><h1>Good creative starts<br/>with a little <em>taste.</em></h1><p>Find the cultural connection between your audience and your next campaign. Bring the brief. Leave with a direction.</p><div className="hero-actions"><button className="primary" onClick={useSample}>Explore a sample <ArrowRight size={16}/></button><a href="#workspace" className="text-link">Start with your own brief <ArrowRight size={14}/></a></div><div className="powered">Cultural research with <strong>Qloo</strong><span>·</span>Human creative judgment, always</div></div><div className="hero-art"><TasteMap/><span className="art-label"><span className="mini-dot"/> A world of interests. One meaningful connection.</span></div></section>
      {showHelp && <section className="help"><button className="help-close quiet" aria-label="Close help" onClick={() => setShowHelp(false)}><X size={18}/></button><h2>From a reference to a reason.</h2><p>1. Describe your campaign. 2. Search Qloo and confirm the exact cultural references you mean. 3. Research connected books, films and brands. 4. Compare structured creative directions and export a production brief.</p><p>The planner runs a transparent research workflow rather than an autonomous language model. Qloo evidence is kept separate from the creative interpretation. Sample mode uses fictional records. Live mode requires a server-side Qloo harness gateway.</p><a href="https://github.com/GSpidey/goldenepics-qloo-creative-agent" target="_blank" rel="noreferrer">View the complete open-source project <ExternalLink size={13}/></a></section>}
      <div className="workspace-heading" id="workspace"><div><span className="eyebrow">YOUR NEXT CAMPAIGN</span><h2>The creative workspace</h2></div><div className="save-label"><Check size={14}/>{saveState}</div></div>
      <div className="workflow-strip"><div className={tab === 'brief' ? 'current' : ''}><span>01</span><FileText size={16}/>Shape the brief</div><ChevronRight size={14}/><div className={tab === 'taste' ? 'current' : ''}><span>02</span><Waypoints size={16}/>Find the connection</div><ChevronRight size={14}/><div className={tab === 'ideas' ? 'current' : ''}><span>03</span><Sparkles size={16}/>Make it meaningful</div></div>
      {notice && <div className="notice" role="status"><Compass size={18}/><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={16}/></button></div>}
      <div className="workspace-grid">
        <aside className="brief-panel">
          <div className="panel-title"><span className="section-index">01</span><h3>Your campaign brief</h3><span className="small-pill">START HERE</span></div>
          <p className="panel-intro">A few details to give the ideas somewhere to go.</p>
          <label>Product or brand<input value={brief.product} maxLength={100} onChange={e => change('product', e.target.value)} placeholder="What are we making a little famous?"/></label>
          <label>What does it help people do?<textarea value={brief.description} maxLength={1000} onChange={e => change('description', e.target.value)} placeholder="The real value, in a sentence or two." rows={3}/></label>
          <label>Who is this for?<textarea value={brief.audience} maxLength={1000} onChange={e => change('audience', e.target.value)} placeholder="Describe a shared interest or a daily need." rows={2}/></label>
          <label>One thing you want them to do<input value={brief.goal} maxLength={1000} onChange={e => change('goal', e.target.value)} placeholder="Try it, visit, sign up…"/></label>
          <div className="field-row"><label>Voice<select value={brief.tone} onChange={e => change('tone', e.target.value)}>{['Warm and playful', 'Calm and reassuring', 'Bold and curious', 'Practical and clear'].map(v => <option key={v}>{v}</option>)}</select></label><label>Format<select value={brief.format} onChange={e => change('format', e.target.value)}>{['30-second vertical video', 'Social carousel', 'Campaign concept'].map(v => <option key={v}>{v}</option>)}</select></label></div>
          <div className="brief-foot"><Layers3 size={15}/><span>Keep it specific. The best stories have a starting point.</span></div>
        </aside>
        <section className="main-panel" ref={output}>
          <nav className="tabs" aria-label="Campaign workflow">{[{ id: 'brief', name: 'Overview', icon: Compass }, { id: 'taste', name: 'Cultural research', icon: Waypoints }, { id: 'ideas', name: 'Creative directions', icon: Sparkles }].map(t => <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)} aria-pressed={tab === t.id}><t.icon size={16}/>{t.name}{t.id === 'ideas' && directions.length > 0 && <span className="count">{directions.length}</span>}</button>)}</nav>
          {tab === 'brief' && <div className="overview"><div className="overview-illustration"><Compass size={38} strokeWidth={1}/><span className="orbit orbit-one">a familiar film</span><span className="orbit orbit-two">a favourite story</span><span className="orbit orbit-three">a new connection</span></div><span className="eyebrow">LESS GUESSING. MORE GROUNDING.</span><h2>Give your next idea<br/>a cultural starting point.</h2><p>What your audience enjoys can open up a richer creative direction. Explore connected books, films and brands, then turn those connections into something distinctly yours.</p><button className="primary" onClick={() => setTab('taste')}>Add cultural references <ArrowRight size={16}/></button><button className="text-link sample-link" onClick={useSample}>Or take the sample for a spin</button><div className="overview-note"><Waypoints size={20}/><span><strong>Evidence you can follow.</strong> Every direction keeps its references and research together.</span></div></div>}
          {tab === 'taste' && <div className="research-view"><div className="view-heading"><div><span className="eyebrow">02 / CULTURAL RESEARCH</span><h2>What is in their orbit?</h2><p>Add public cultural references that represent the interests you want to explore.</p></div><span className={'connection ' + (connection === 'configured' ? 'connected' : '')}><span/>{connection === 'configured' ? 'Research connected' : connection === 'checking' ? 'Checking connection' : connection === 'awaiting_key' ? 'Awaiting event key' : connection === 'warming' ? 'Research service starting' : 'Live setup pending'}</span></div>
            <div className="search-box"><label className="sr-only" htmlFor="reference-type">Reference category</label><select id="reference-type" value={type} onChange={e => { requestVersion.current++; setBusy(''); setType(e.target.value); setResults([]); }}>{TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select><label className="sr-only" htmlFor="reference-query">Reference name</label><input id="reference-query" placeholder="Search a title, artist or brand…" maxLength={100} value={query} onChange={e => { requestVersion.current++; setBusy(''); setQuery(e.target.value); setResults([]); }} onKeyDown={e => { if (e.key === 'Enter') search(); }}/><button aria-label="Search Qloo references" className="primary" onClick={search}>{busy === 'search' ? <LoaderCircle className="spin" size={18}/> : <Search size={18}/>}</button></div>
            {!!results.length && <div className="search-results"><p>Confirm the reference you mean. Search ranking is a candidate list.</p>{results.map(r => <button key={r.id} onClick={() => { if (seeds.length >= 5) { setNotice('Keep your research focused with up to five references.'); return; } if (!seeds.some(s => s.id === r.id)) updateSeeds([...seeds, r]); }}><span><strong>{r.name}</strong><small>{r.type} · {r.description || r.id}</small></span>{seeds.some(s => s.id === r.id) ? <Check size={18}/> : <Plus size={18}/>}</button>)}</div>}
            <div className="reference-heading"><h3>Your cultural references</h3><span>{seeds.length}/5</span></div>
            {seeds.length ? <div className="seed-list">{seeds.map(s => <div className="seed" key={s.id}><span className="seed-icon">{s.type === 'book' ? 'Aa' : s.type === 'movie' ? '▷' : '✦'}</span><span><strong>{s.name}</strong><small>{s.type}{s.id.startsWith('sample:') ? ' · fictional sample' : ''}</small></span><button aria-label={'Remove ' + s.name} onClick={() => updateSeeds(seeds.filter(v => v.id !== s.id))}><X size={16}/></button></div>)}</div> : <div className="empty-references"><Waypoints size={28}/><p>A book. A film. A brand they love.<br/>Start with one reference and follow the connection.</p></div>}
            <button className="primary full" onClick={runResearch}>{busy === 'research' ? <><LoaderCircle className="spin" size={16}/>Researching cultural connections…</> : <><Sparkles size={16}/>Find creative connections <ArrowRight size={16}/></>}</button><div className="research-note"><CircleHelp size={16}/><p>Only the selected entity IDs are sent to cultural research. Your product brief stays in this workspace. Results describe aggregate affinities; creative relevance is a judgment to test.</p></div>
          </div>}
          {tab === 'ideas' && <div className="ideas-view"><div className="view-heading"><div><span className="eyebrow">03 / CREATIVE DIRECTIONS</span><h2>{directions.length ? 'Three ways into the story.' : 'A good idea needs a starting point.'}</h2><p>{directions.length ? 'Compare the possibilities. Choose a direction. Make it yours.' : 'Add your brief and research, or explore the sample.'}</p></div>{research && <span className={'mode-pill ' + research.mode}>{research.mode === 'sample' ? 'FICTIONAL SAMPLE' : 'LIVE QLOO EVIDENCE'}</span>}</div>
            {!directions.length ? <div className="empty-references"><Sparkles size={32}/><p>Culture first. Creative next.</p><button className="primary" onClick={() => setTab('taste')}>Explore references <ArrowRight size={16}/></button><button className="text-link sample-link" onClick={useSample}>Use the sample workspace</button></div> : <>
              <div className="direction-grid">{directions.map((d, i) => <button key={d.id} className={'direction-card ' + d.color + (selected === d.id ? ' selected' : '')} onClick={() => setSelected(d.id)} aria-pressed={selected === d.id}><span className="direction-number">DIRECTION 0{i + 1}{selected === d.id && <Check size={15}/>}</span><span className="direction-art" aria-hidden="true">{i === 0 ? <span className="hill"><span>✦</span></span> : i === 1 ? <span className="together"><i/><i/></span> : <span className="window"><span>✧</span></span>}</span><h3>{d.label}</h3><p>{d.lens}</p><span className="card-link">{selected === d.id ? 'Selected direction' : 'Explore this idea'} <ArrowRight size={14}/></span></button>)}</div>
              {active && <article className="selected-detail"><div className="detail-title"><span className="eyebrow">YOUR SELECTED DIRECTION</span><h2>{active.title}</h2><p>{active.rationale}</p></div><div className="evidence-link"><Waypoints size={16}/><span>Research references: {active.evidenceNames.join(' + ')}</span></div><div className="production-note"><h4>Without cultural research</h4><p>{active.baseline}</p><h4>What the evidence changes</h4><p>{active.culturalChange}</p></div><h3>{brief.format === '30-second vertical video' ? 'A 30-second starting script' : 'A story sequence to adapt'}</h3>{active.script.map(s => <div className="script-row" key={s.time}><span>{s.time}</span><div><strong>{s.voice}</strong><p>{s.picture}</p></div></div>)}<div className="production-note"><h4>Creative treatment</h4><p>{active.productionNotes}</p><h4>What to test</h4><p>{active.test}</p></div><label>Refine your production notes<textarea rows={2} placeholder="For example: slower pacing, natural light, a closer product demonstration…" value={brief.refinement} maxLength={1000} onChange={e => change('refinement', e.target.value)}/></label></article>}
              <section className="evidence-section"><div className="evidence-heading"><h3><Waypoints size={17}/>Follow the evidence</h3><span>{evidence.length} cultural references</span></div><p className="muted">{research?.mode === 'sample' ? 'These original fictional records demonstrate the interface. They are not Qloo results.' : 'Qloo returned these connected entities. The directions above are our structured creative interpretations.'}</p><div className="evidence-grid">{evidence.map(e => <div className="evidence-item" key={e.id}><span className="entity-type">{e.type.replace('_', ' ')}</span><h4>{e.name}</h4><p>{e.tags?.slice(0, 4).join(' · ') || e.description || 'Explore this connection in your creative research.'}</p>{typeof e.affinity === 'number' && <small>Qloo affinity: {e.affinity.toFixed(3)} · relative signal</small>}<code title={e.id}>{e.id}</code></div>)}</div><details><summary>Research trail & provenance</summary><p>Retrieved: {research && new Date(research.fetchedAt).toLocaleString()}. Planner: deterministic creative interpretation.</p>{research?.trace.map((t, i) => <p key={i}><strong>{t.step} · {t.status}</strong><br/>{t.message}</p>)}</details></section>
              <div className="export-panel"><div><span className="eyebrow">TAKE THE IDEA WITH YOU</span><h3>Your brief, ready for the next step.</h3><p>Includes the {selected ? 'selected direction' : 'three directions'}, references, script and research trail.</p></div><div><button className="primary" onClick={() => download('md')}><ArrowDownToLine size={16}/>Export brief</button><button className="quiet" onClick={() => download('json')}>JSON <ArrowDownToLine size={13}/></button></div></div>
            </>}
          </div>}
        </section>
      </div>
      <section className="principles"><div><Waypoints size={19}/><span><strong>Grounded in culture</strong><small>Connected references, with a visible research trail.</small></span></div><div><Sparkles size={19}/><span><strong>Made for interpretation</strong><small>Cultural evidence is a starting point for creativity.</small></span></div><div><ArrowDownToLine size={19}/><span><strong>Ready to take further</strong><small>A portable brief for your next production.</small></span></div></section>
      <footer><span>GoldenEpics <strong>✦</strong> A little more possibility.</span><a href="https://github.com/GSpidey/goldenepics-qloo-creative-agent" target="_blank" rel="noreferrer">Open source · MIT <ExternalLink size={12}/></a><button className="quiet" onClick={() => { if (confirm('Clear this device’s campaign workspace? Export a copy first if you want to keep it.')) { requestVersion.current++; setBusy(''); setBrief(initialBrief); setSeeds([]); setResearch(null); setSelected(''); setResults([]); setNotice('A fresh workspace is ready.'); setTab('brief'); } }}><RotateCcw size={12}/>Fresh workspace</button></footer>
    </main>
  </div>;
}
