"use client";
import Link from 'next/link';
import { useState } from 'react';

const github = 'https://github.com/yashannadate/ZecForage';
const button = 'inline-flex min-h-11 items-center justify-center gap-3 rounded-md px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300';
const features = [
  { title: 'ZIP-321 Payment Builder', label: '01 / BUILD', description: 'Generate structured Zcash payment requests.', type: 0, detail: 'Explore recipient, amount, and memo fields in a readable payment URI preview.', href: '/builder' },
  { title: 'Wallet Compatibility', label: '02 / CONNECT', description: 'Explore wallet connectivity and payment handoff workflows.', type: 1, detail: 'Understand the handoff between your application, a payment request, and a compatible wallet. No wallet connection is made here.', href: '/wallets' },
  { title: 'Payment Scenario Simulator', label: '03 / SIMULATE', description: 'Explore payment confirmation and settlement scenarios.', type: 2, detail: 'Walk through a deterministic confirmation scenario without moving funds or connecting to the Zcash network.', href: '/scenarios' },
  { title: 'Webhook Workbench', label: '04 / INSPECT', description: 'Test webhook signatures, delivery and event handling.', type: 3, detail: 'Inspect an illustrative event payload. This preview does not deliver webhooks or verify real signatures.', href: '/webhooks' },
];
const snippets = [
  ['// A structured payment request', 'const payment = {', '  recipient: "YOUR_ZCASH_ADDRESS",', '  amount: "0.25",', '  memo: "Order #1042"', '};', '', '// Preview the ZIP-321 URI', 'zcash:YOUR_ZCASH_ADDRESS?amount=0.25'],
  ['// Illustrative payment lifecycle', 'const scenario = {', '  network: "simulation",', '  confirmations: 3,', '  status: "confirmed"', '};', '', '// No funds moved. No network calls.', 'simulation.complete → true'],
  ['// Illustrative webhook event', '{', '  "type": "payment.confirmed",', '  "environment": "preview",', '  "data": {', '    "amount": "0.25",', '    "confirmations": 3', '  }', '}'],
];

function Icon({ name = 'arrow', className = '' }: { name?: string; className?: string }) {
  return <svg className={`h-4 w-4 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    {name === 'github' ? <><path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-3c3-.4 6-1.5 6-6a4.7 4.7 0 0 0-1.3-3.3A4.4 4.4 0 0 0 18.6 2S17.4 1.6 15 3.3a12 12 0 0 0-6 0C6.6 1.6 5.4 2 5.4 2a4.4 4.4 0 0 0-.1 3.7A4.7 4.7 0 0 0 4 9c0 4.5 3 5.6 6 6a3.5 3.5 0 0 0-1 3v4" /></> :
      name === 'copy' ? <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></> :
      name === 'check' ? <path d="m5 12 4 4L19 6" /> :
      name === 'code' ? <><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-16-2 20" /></> :
      name === 'menu' ? <path d="M4 6h16M4 12h16M4 18h16" /> :
      <path d="M4 12h15m-6-6 6 6-6 6" />}
  </svg>;
}

function Logo() {
  return <Link href="/" aria-label="ZecForage home" className="flex min-h-11 items-center gap-2.5 text-xl font-medium tracking-[-0.8px] text-white">
    <svg width="28" height="30" viewBox="0 0 28 30" fill="none" aria-hidden="true"><path d="M5 5h19L6 25h18M12 0v5m5 20v5M2 15h24" stroke="white" strokeWidth="2.7" /></svg>ZecForage
  </Link>;
}

function MatrixArt({ hero = false, type = 0 }: { hero?: boolean; type?: number }) {
  const dots = Array.from({ length: hero ? 2304 : 504 }, (_, i) => {
    const cols = hero ? 48 : 28;
    const x = i % cols;
    const y = Math.floor(i / cols);
    const nx = (x - cols / 2) / (cols / 2);
    const ny = (y - (hero ? 24 : 9)) / (hero ? 24 : 9);
    let inside = false;
    if (hero) inside = (Math.abs(nx) < .64 && Math.abs(ny) < .7 && (Math.abs(ny + nx * .93) < .23 || Math.abs(ny - .54) < .14 || Math.abs(ny + .54) < .14)) || (Math.abs(nx) < .1 && Math.abs(ny) > .65 && Math.abs(ny) < .89);
    else if (type === 0) inside = Math.abs(nx) < .68 && Math.abs(ny) < .7 && (Math.abs(ny + nx) < .25 || Math.abs(ny) > .47);
    else if (type === 1) inside = Math.abs(Math.sqrt(nx * nx + ny * ny) - .58) < .15 || (Math.abs(nx) < .17 && Math.abs(ny) < .25);
    else if (type === 2) inside = Math.abs(nx) < .8 && Math.abs(ny) < .65 && (Math.abs(ny - Math.sin(nx * 6) * .4) < .19);
    else inside = Math.abs(nx) + Math.abs(ny) < .9 && Math.abs(nx) + Math.abs(ny) > .48;
    if (!inside && (i * 17 % 89 > 1)) return null;
    return <text key={i} x={x * 10 + 10} y={y * 10 + 10} fill={x + y % 5 > cols * .65 ? '#35C9E8' : '#6c9ddc'} fontSize={hero ? 6 : 7} opacity={inside ? .5 + (i % 4) * .12 : .18}>{i % 3 === 0 ? '1' : '·'}</text>;
  });
  return <svg viewBox={hero ? '0 0 490 490' : '0 0 290 190'} fill="none" aria-hidden="true" className={`w-full motion-safe:animate-[float_14s_ease-in-out_infinite] ${hero ? 'max-w-[530px]' : 'h-44'}`}>
    {hero && <g stroke="#404040" strokeWidth=".6" opacity=".5"><path d="M20 145h80l45 45m205 130 45 45h75M60 360h65m240-230h75M245 5v65m0 350v65" /><path d="M10 10h15m-7-7v15m440 440h15m-7-7v15" /></g>}
    <g className="motion-safe:animate-[breathe_8s_ease-in-out_infinite]">{dots}</g>
    {hero && <g fill="#929292" fontFamily="monospace" fontSize="7"><text x="22" y="130">INPUT / ZIP-321</text><text x="355" y="385">OUTPUT / VERIFIED</text><text x="354" y="75">ZEC_PROTOCOL</text><text x="28" y="425">38.024 / 112.103</text></g>}
  </svg>;
}

function App() {
  const [menu, setMenu] = useState(false);
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [run, setRun] = useState(false);
  const [time, setTime] = useState('');
  const [amount, setAmount] = useState('0.25');
  const [address, setAddress] = useState('');
  const [uri, setUri] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(snippets[tab].join('\n')); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setCopied(false); }
  }
  function openFeature(index: number) {
    setActiveFeature(activeFeature === index ? null : index);
    setRun(false);
  }
  return <div className="min-h-screen overflow-x-hidden bg-black font-sans text-white selection:bg-cyan-900">
    <header className="border-b border-neutral-800">
      <nav aria-label="Main navigation" className="mx-auto flex h-20 max-w-[1200px] items-center justify-between gap-6 px-6 lg:px-10">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-neutral-300 md:flex">
          <a className="transition-colors hover:text-white" href="#platform">Product</a>
          <Link href="/dashboard" className="transition-colors hover:text-white">Workbench</Link>
          <a href="#developers" className="hover:text-white">Documentation</a>
          <a href="#architecture" className="hover:text-white">Architecture</a>
          <a href={github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white">GitHub <span aria-hidden="true">↗</span></a>
        </div>
        <Link href="/dashboard" className={`${button} hidden bg-white text-black hover:bg-neutral-200 md:inline-flex`}>Launch Workbench <Icon /></Link>
        <button aria-label="Toggle navigation" aria-expanded={menu} onClick={() => setMenu(!menu)} className={`${button} border border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 md:hidden`}><Icon name="menu" /></button>
      </nav>
      {menu && <div className="grid gap-1 border-t border-neutral-800 bg-[#080808] px-6 py-3 md:hidden">
        <Link href="/dashboard" onClick={() => setMenu(false)} className="flex min-h-11 items-center justify-between text-sm font-medium text-cyan-300">Launch Workbench <span>→</span></Link>
        {[['Product', '#platform'], ['Documentation', '#developers'], ['Architecture', '#architecture'], ['GitHub', github]].map(([label, href]) => <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} onClick={() => setMenu(false)} className="flex min-h-11 items-center text-sm text-neutral-300 hover:text-white">{label}</a>)}
      </div>}
    </header>

    <main className="mx-auto max-w-[1200px] border-x border-neutral-900">
      <section className="relative grid min-h-[610px] items-center gap-0 overflow-hidden px-6 py-20 md:grid-cols-[1.35fr_1fr] lg:px-10 lg:py-24">
        <div className="relative z-10 min-w-0">
          <div className="mb-8 flex items-center gap-2.5 font-mono text-xs font-normal uppercase tracking-[1.6px] text-[#929292]"><span className="h-1.5 w-1.5 bg-[#35C9E8]" />ZCASH DEVELOPER INFRASTRUCTURE</div>
          <h1 className="max-w-[740px] text-[43px] leading-[1.12] font-medium tracking-[-2.2px] text-white md:text-[51px] lg:text-[62px] lg:tracking-[-3px]">Zcash payment<br className="hidden lg:block" /> infrastructure.<br /><span className="text-[#929292]">Built for developers.</span></h1>
          <p className="mt-6 max-w-[490px] text-base font-normal leading-relaxed text-[#929292]">Build, validate, simulate, and integrate Zcash payment workflows with developer-first tools for merchants and applications.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className={`${button} bg-white text-black hover:bg-neutral-200`}>Launch Workbench <Icon /></Link>
            <a href={github} target="_blank" rel="noreferrer" className={`${button} border border-neutral-700 bg-black text-white hover:bg-neutral-900`}><Icon name="github" /> View on GitHub</a>
          </div>
          <div className="mt-7 flex items-center gap-2 font-mono text-xs text-neutral-500"><span className="h-1 w-1 rounded-full bg-neutral-500" />Privacy-native. Developer-first. Open by design.</div>
        </div>
        <div className="pointer-events-none -my-7 hidden min-w-0 md:block"><MatrixArt hero /></div>
        <span className="absolute bottom-5 right-6 font-mono text-xs tracking-widest text-neutral-600" aria-hidden="true">[ ZF / 001 ]</span>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-5 border-y border-neutral-800 bg-[#080808] px-6 py-5 lg:px-10">
        <span className="text-sm text-[#929292]">Less infrastructure friction. <span className="text-neutral-200">More building.</span></span>
        <div className="flex gap-6 font-mono text-xs text-neutral-300"><span className="flex items-center gap-2"><Icon name="code" /> ZIP-321 native</span><span className="flex items-center gap-2"><Icon name="check" /> No funds in preview</span></div>
      </div>

      <section id="platform" className="scroll-mt-8 pt-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 px-6 lg:px-10">
          <div><p className="mb-4 font-mono text-xs tracking-[2px] text-neutral-500">THE PLATFORM</p><h2 className="text-3xl font-medium tracking-[-1px] lg:text-[37px]">Everything between an idea<br /><span className="text-neutral-500">and a payment.</span></h2></div>
          <p className="max-w-[330px] text-sm leading-6 text-[#929292]">Purpose-built tools for exploring the Zcash payment stack. One focused developer experience.</p>
        </div>
        <div className="grid border-y border-neutral-800 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => <article key={feature.title} className={`min-w-0 border-neutral-800 px-6 pt-6 pb-7 ${i < 3 ? 'lg:border-r' : ''} ${i % 2 === 0 ? 'md:border-r' : ''} ${i < 2 ? 'border-b lg:border-b-0' : ''}`}>
            <div className="flex items-center justify-between"><p className="font-mono text-xs tracking-wide text-neutral-500">{feature.label}</p><Link href={feature.href} className="font-mono text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">Launch <span aria-hidden="true">→</span></Link></div>
            <div className="my-6"><MatrixArt type={feature.type} /></div>
            <h3 className="text-base font-medium tracking-[-.35px]">{feature.title}</h3>
            <p className="mt-3 min-h-[60px] text-sm leading-6 text-[#929292]">{feature.description}</p>
            <button onClick={() => openFeature(i)} aria-expanded={activeFeature === i} className="mt-3 flex min-h-11 items-center gap-2 text-sm text-neutral-300 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300">{activeFeature === i ? 'Close preview' : 'Explore tool'} <Icon /></button>
          </article>)}
        </div>
        {activeFeature !== null && <div className="border-b border-neutral-800 bg-[#080808] p-6 lg:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4"><span className="font-mono text-xs text-cyan-300">LOCAL INTERACTIVE PREVIEW</span><Link href={features[activeFeature].href} className="text-xs font-mono text-cyan-300 hover:text-cyan-100 flex items-center gap-1.5 underline underline-offset-4">Open full {features[activeFeature].title} in Workbench →</Link></div>
          <h3 className="mt-3 text-xl">{features[activeFeature].title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#929292]">{features[activeFeature].detail}</p>
          {activeFeature === 0 ? <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); setUri(`zcash:${encodeURIComponent(address)}?amount=${amount}`); }}>
            <label className="grid gap-2 text-sm text-neutral-300 w-full sm:w-auto">Recipient address<input required value={address} onChange={e => setAddress(e.target.value)} placeholder="Your Zcash address" className="min-h-11 rounded border border-neutral-700 bg-black px-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-300" /></label>
            <label className="grid gap-2 text-sm text-neutral-300 w-full sm:w-auto">Amount (ZEC)<input required type="number" step="0.00000001" min="0.00000001" value={amount} onChange={e => setAmount(e.target.value)} className="min-h-11 w-full sm:w-36 rounded border border-neutral-700 bg-black px-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-300" /></label>
            <button className={`${button} bg-white text-black hover:bg-neutral-200 w-full sm:w-auto`}>Generate preview <Icon /></button>
            {uri && <p className="w-full break-all font-mono text-sm text-cyan-200">{uri}<span className="mt-2 block font-sans text-neutral-300">URI formatting preview only. Address validity is not checked.</span></p>}
          </form> : <><button onClick={() => { setRun(true); setTime(new Date().toLocaleTimeString()); }} className={`${button} mt-5 border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800`}>Run local preview <Icon /></button>{run && <pre role="status" className="mt-4 overflow-x-auto font-mono text-sm leading-7 text-cyan-200">{`[${time}] ${activeFeature === 1 ? 'Request → wallet handoff → user approval (illustrative)' : activeFeature === 2 ? 'Pending → 1 confirmation → 3 confirmations → confirmed (simulated)' : 'payment.confirmed → example payload inspected (not delivered)'}`}</pre>}</>}
        </div>}
      </section>

      <section id="workflow" className="scroll-mt-8 border-b border-neutral-800 px-6 py-20 lg:px-10">
        <p className="mb-4 font-mono text-xs tracking-[2px] text-neutral-500">FROM FIRST REQUEST TO INTEGRATION</p>
        <h2 className="text-3xl font-medium tracking-[-1px] lg:text-[37px]">A simpler path to building.</h2>
        <div className="mt-12 grid gap-9 md:grid-cols-3">
          {[['01', 'Compose your request', 'Define a recipient, amount, and memo with the ZIP-321 payment request format.'], ['02', 'Explore the edge cases', 'Walk through wallet handoffs, confirmation states, and illustrative payment events.'], ['03', 'Integrate with confidence', 'Take the patterns into your application. Connect and verify your own production infrastructure.']].map(([n, title, desc]) => <div key={n} className="min-w-0"><div className="mb-6 flex items-center gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center border border-neutral-700 font-mono text-xs text-neutral-300">{n}</span><div className="h-px w-full bg-neutral-800" /></div><h3 className="text-base">{title}</h3><p className="mt-3 max-w-72 text-sm leading-6 text-[#929292]">{desc}</p></div>)}
        </div>
      </section>

      <section id="developers" className="grid scroll-mt-8 gap-10 border-b border-neutral-800 px-6 py-20 md:grid-cols-2 lg:gap-20 lg:px-10">
        <div className="min-w-0">
          <p className="mb-4 font-mono text-xs tracking-[2px] text-neutral-500">DEVELOPER EXPERIENCE</p>
          <h2 className="text-3xl leading-tight font-medium tracking-[-1px] lg:text-[37px]">Less guesswork.<br /><span className="text-neutral-500">More control.</span></h2>
          <p className="mt-5 max-w-96 text-sm leading-7 text-[#929292]">Understand what you’re sending and what happens next. Inspect payment structures and reason about your integration before going live.</p>
          <ul className="mt-7 space-y-4 text-sm text-neutral-300">{['Human-readable payment requests', 'Explicit payment lifecycle states', 'Inspectable event payloads', 'Safe, local-only exploration'].map(text => <li key={text} className="flex gap-3"><Icon name="check" className="text-neutral-500" />{text}</li>)}</ul>
        </div>
        <div className="min-w-0 self-center rounded-lg border border-neutral-800 bg-[#080808]">
          <div className="flex items-center justify-between border-b border-neutral-800 px-4"><div role="tablist" aria-label="Code examples" className="flex min-w-0 gap-4">{['Request', 'Simulation', 'Webhook'].map((label, i) => <button key={label} role="tab" aria-selected={tab === i} onClick={() => { setTab(i); setCopied(false); }} className={`min-h-12 border-b px-0.5 font-mono text-xs ${tab === i ? 'border-white text-white' : 'border-transparent text-neutral-500'}`}>{label}</button>)}</div><button onClick={copy} aria-label={copied ? 'Copied' : 'Copy example'} className="flex min-h-11 min-w-11 items-center justify-center text-neutral-300 focus-visible:ring-2 focus-visible:ring-cyan-300"><Icon name={copied ? 'check' : 'copy'} /></button></div>
          <div role="tabpanel" aria-label={`${['Request', 'Simulation', 'Webhook'][tab]} example`} className="overflow-x-auto py-6 pr-4 font-mono text-sm leading-7">{snippets[tab].map((line, i) => <div className="flex whitespace-pre" key={i}><span className="w-11 shrink-0 select-none text-center text-neutral-600">{i + 1}</span><code className={line.startsWith('//') ? 'text-neutral-500' : line.includes('"') ? 'text-[#91b7c0]' : 'text-neutral-300'}>{line || ' '}</code></div>)}</div>
          <div className="flex items-center gap-2 border-t border-neutral-800 px-4 py-3 font-mono text-xs text-neutral-500"><span className="h-1 w-1 rounded-full bg-cyan-300" />Illustrative example · not a live SDK</div>
        </div>
      </section>

      <section id="architecture" className="border-b border-neutral-800 px-6 py-16 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="mb-4 font-mono text-xs tracking-[2px] text-neutral-500">TECHNICAL ARCHITECTURE</p><h2 className="text-2xl font-medium tracking-tight">Clear boundaries. Composable workflows.</h2></div><span className="font-mono text-xs text-neutral-500">CONCEPTUAL INTEGRATION MAP</span></div>
        <div className="mt-10 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">{['Your application', 'ZecForage tools', 'Your Zcash integration'].map((label, i) => <div key={label} className="contents">{i > 0 && <Icon className="mx-auto rotate-90 text-neutral-600 md:rotate-0" />}<div className="flex min-h-24 items-center justify-center gap-3 border border-neutral-800 bg-[#080808] px-3 font-mono text-sm text-neutral-300"><Icon name={i === 1 ? 'code' : 'check'} />{label}</div></div>)}</div>
        <p className="mt-5 text-sm leading-6 text-[#929292]">ZecForage previews do not custody funds, broadcast transactions, or replace a wallet or node.</p>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-8 border-b border-neutral-800 px-6 py-14 lg:px-10">
        <div className="flex items-start gap-5"><Icon name="github" className="mt-1 h-8 w-8" /><div><h2 className="text-xl font-medium tracking-tight">Built in the open.</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[#929292]">Explore the project, inspect the code, and help shape better Zcash tooling.</p></div></div>
        <a href={github} target="_blank" rel="noreferrer" className={`${button} border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800`}>Find ZecForage on GitHub <span aria-hidden="true">↗</span></a>
      </section>
      <section className="relative overflow-hidden px-6 py-20 text-center lg:py-28">
        <p className="mb-5 font-mono text-xs tracking-[2px] text-neutral-500">BUILD WHAT’S NEXT</p>
        <h2 className="text-4xl font-medium tracking-[-1.5px] lg:text-5xl">Your next payment flow<br /><span className="text-neutral-500">starts here.</span></h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#929292]">Less complexity between your code and Zcash.<br />Start exploring the tools. Build on your terms.</p>
        <Link href="/dashboard" className={`${button} mt-8 bg-white text-black hover:bg-neutral-200`}>Launch Workbench <Icon /></Link>
      </section>
    </main>
    <footer className="border-t border-neutral-800"><div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-6 py-8 lg:px-10"><Logo /><span className="text-xs text-neutral-500">© {new Date().getFullYear()} ZecForage</span><div className="flex flex-wrap gap-6 text-sm text-[#929292]"><Link className="flex min-h-11 items-center hover:text-white" href="/dashboard">Workbench</Link><a className="flex min-h-11 items-center hover:text-white" href="#developers">Documentation</a><a className="flex min-h-11 items-center hover:text-white" href={github} target="_blank" rel="noreferrer">GitHub ↗</a><a className="flex min-h-11 items-center hover:text-white" href="#architecture">Architecture</a></div></div></footer>
  </div>;
}

export default App;



