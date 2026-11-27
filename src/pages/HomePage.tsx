import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import MarketingHeader from '../components/marketing/MarketingHeader'
import MarketingFooter from '../components/marketing/MarketingFooter'
import Art from '../components/mail/Art'
import Envelope from '../components/mail/Envelope'
import HoloSeal from '../components/mail/HoloSeal'
import LetterSheet from '../components/mail/LetterSheet'
import Postcard3D from '../components/mail/Postcard3D'
import Postmark from '../components/mail/Postmark'
import Stamp from '../components/mail/Stamp'
import Sticker from '../components/mail/Sticker'
import { useTilt } from '../components/mail/useTilt'
import ShareScene from '../features/studio/ShareScene'
import { sampleLetter, samplePostcard } from '../data/sampleDocuments'

function Caption({ name, children }: { name: string; children: string }) {
  return <div className="mt-6 text-center text-paper"><h3 className="display text-[26px]">{name}</h3><p className="mx-auto mt-1 max-w-[17rem] text-[16px] leading-snug text-paper/85">{children}</p></div>
}

function HeroScene() {
  const tilt = useTilt<HTMLDivElement>(8)
  const [open, setOpen] = useState(false)
  useEffect(() => { const t = window.setTimeout(() => setOpen(true), 500); return () => window.clearTimeout(t) }, [])
  return (
    <div className="scene" ref={tilt.ref} onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave}>
      <div className="scene-desk grain" />
      <div className="scene-tilt">
        <div className="scene-env"><Envelope tone="tomato" open={open}><LetterSheet issue="No. 08" title="Slow mornings"><p>This month, write to someone you have not spoken to in a while.</p><p>Use a stamp. Take your time.</p></LetterSheet></Envelope></div>
        <Postmark className="scene-mark" />
        <div className="scene-pc"><Postcard3D art="harbour" tone="saffron" place="Harbour town" message={'Wish you were here.\nThe water is exactly this blue.'} signoff="Jo" to={['Sam Ortega', '14 Orchard Lane', 'Hull']} stamp={{ tone: 'tomato', art: 'fish' }} /></div>
        <div className="scene-stamp"><Stamp tone="cobalt" art="sun" lines={['LUMIE']} label="" /></div>
        <span className="tape scene-tape" style={{ width: '14%', height: '4.5%' }} />
        <HoloSeal className="scene-seal" />
        <div className="scene-sticker" style={{ width: '14%' }}><Sticker kind="fish" color="#f7b4c6" size={90} /></div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const tiltStack = useTilt<HTMLDivElement>(10)
  return (
    <div className="overflow-x-clip bg-cream text-ink">
      <MarketingHeader />
      <main>
        <section className="graph">
          <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-14 md:grid-cols-[1fr_1.05fr] md:px-10 md:py-20">
            <div>
              <h1 className="display text-[clamp(46px,7vw,92px)]">Letters and postcards, made in your own words.</h1>
              <p className="mt-6 max-w-[34rem] text-[19px] leading-relaxed text-muted">Make something thoughtful, then make it yours. Write freely, shape the page, add photographs and postal details, and ask Lumie's assistant for a starting point or a fresh perspective when you want one.</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/app/create" className="btn btn-primary">Open the studio <ArrowUpRight size={18} /></Link>
                <a href="#how" className="btn btn-paper">See how it works <ArrowDown size={16} /></a>
              </div>
              <p className="mt-8 max-w-[30rem] text-[15px] leading-relaxed text-muted">The assistant shown in this preview uses sample responses. Live AI and cloud accounts are not connected yet.</p>
            </div>
            <HeroScene />
          </div>
        </section>

        <section id="formats" className="on-dark bg-cobalt text-paper">
          <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 md:py-28">
            <h2 className="display max-w-[720px] text-[clamp(38px,5.5vw,68px)]">Start with a format. Take it anywhere.</h2>
            <p className="mt-4 max-w-[560px] text-[19px] leading-relaxed text-paper/85">Choose a letter, postcard, photo card, collage or memory page. Then change the words, paper, ink, stamps and stickers until it feels like yours.</p>
            <div className="mt-16 grid gap-x-8 gap-y-16 md:grid-cols-6">
              <div className="md:col-span-2">
                <div className="tilt mx-auto w-[82%] rotate-[-3deg]"><LetterSheet issue="No. 03" title="Dear Mara," sign="Jo"><p>The cherry tree outside the flat is finally in flower.</p><p>Come in April if you can.</p></LetterSheet></div>
                <Caption name="Letter">A full page set in typewriter, handwriting or a serif.</Caption>
              </div>
              <div className="md:col-span-2">
                <div className="mx-auto w-[66%]"><Postcard3D art="hills" tone="moss" place="Green hills" message="Climbed it twice. Packed too many sandwiches." signoff="Ade" to={['Tola Bello', '2 Ring Road', 'Ibadan']} stamp={{ tone: 'saffron', art: 'hills' }} /></div>
                <Caption name="Postcard">A 6 by 4 card with a stamp and a postmark. Click it to turn it over.</Caption>
              </div>
              <div className="md:col-span-2">
                <div className="tilt relative mx-auto w-[74%] rotate-2 bg-paper p-[5%] pb-[16%] shadow-lift"><div className="aspect-square overflow-hidden"><Art kind="doorway" className="block h-full w-full" /></div><p className="hand absolute inset-x-0 bottom-[3%] text-center text-[30px] leading-none text-cobalt">Corner café</p></div>
                <Caption name="Photo card">A square print with a picture and a caption.</Caption>
              </div>
              <div className="md:col-span-3">
                <div className="gingham relative mx-auto h-[300px] max-w-[520px] overflow-hidden rounded-2xl border-2 border-navy shadow-[0_4px_0_#121c5a]">
                  <div className="absolute left-[8%] top-[10%] w-[24%] rotate-[-8deg]"><Postcard3D art="tins" tone="bubblegum" message="" flat className="pointer-events-none" /></div>
                  <div className="absolute left-[36%] top-[22%] w-[18%] rotate-6"><Stamp tone="tomato" art="flower" lines={['POST']} label="" /></div>
                  <div className="absolute right-[8%] top-[8%] w-[26%] rotate-[5deg] bg-paper p-2 pb-6 shadow-lift"><div className="aspect-square overflow-hidden"><Art kind="hills" className="block h-full w-full" /></div></div>
                  <div className="absolute bottom-[10%] right-[30%]"><Sticker kind="heart" color="#ee4a2f" size={70} /></div>
                  <div className="absolute bottom-[8%] right-[8%]"><Sticker kind="sun" color="#f2b632" size={64} /></div>
                  <span className="tape" style={{ left: '30%', top: '4%', width: '14%', height: 22, transform: 'rotate(-14deg)' }} />
                </div>
                <Caption name="Collage">Layer photos, stamps and stickers on one sheet.</Caption>
              </div>
              <div className="md:col-span-3">
                <div className="tilt relative mx-auto w-[min(440px,100%)] rotate-[-2deg] rounded-sm bg-paper p-6 pb-8 text-ink shadow-lift">
                  <div className="grid grid-cols-[1fr_1.1fr] gap-5">
                    <div className="aspect-[4/5] overflow-hidden border-[6px] border-white shadow-lift"><Art kind="harbour" className="block h-full w-full" /></div>
                    <div className="font-type text-[14px] leading-relaxed"><p className="display text-[22px]">Amalfi, June</p><p className="mt-2">Ferry at 9. Lemon granita on the steps. Lost the map, found the bakery.</p></div>
                  </div>
                  <div className="mt-4 flex items-center justify-between"><span className="hand text-[26px] text-cobalt">best day</span><div className="w-12"><Stamp tone="cobalt" art="sun" lines={[]} label="" /></div></div>
                </div>
                <Caption name="Memory page">A page for a trip, a day or a person.</Caption>
              </div>
            </div>
          </div>
        </section>

        <section className="graph">
          <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 md:py-28">
            <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-end">
              <h2 className="display text-[clamp(38px,5vw,62px)]">Export a picture that looks like a flat lay.</h2>
              <p className="text-[18px] leading-relaxed text-muted">The share image sets your piece on a desk next to an envelope, a stamp and a holographic seal. Choose a gingham, cobalt, graph paper or tomato backdrop. Download it at 1080 by 1350 for a post, 1080 by 1920 for a story or 1080 by 1080 as a square.</p>
            </div>
            <div className="mt-14 flex items-start gap-6 overflow-x-auto pb-6 md:justify-between md:overflow-visible">
              <div className="shrink-0"><ShareScene document={sampleLetter} backdrop="gingham" size="post" scale={0.59} /></div>
              <div className="shrink-0"><ShareScene document={samplePostcard} backdrop="cobalt" size="story" scale={0.417} /></div>
              <div className="shrink-0"><ShareScene document={sampleLetter} backdrop="tomato" size="square" scale={0.74} /></div>
            </div>
          </div>
        </section>

        <section className="bg-tomato">
          <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 py-20 md:grid-cols-2 md:px-10 md:py-28">
            <div>
              <h2 className="display text-[clamp(38px,5vw,62px)]">Print it at true size.</h2>
              <p className="mt-5 max-w-[30rem] text-[19px] leading-relaxed text-ink/85">Letters print at 8.5 by 11 inches and postcards at 6 by 4. Choose Save as PDF in the print dialog if you want a file instead of paper.</p>
              <Link to="/app/create" className="btn btn-paper mt-8">Try the print view <ArrowUpRight size={18} /></Link>
            </div>
            <div ref={tiltStack.ref} onPointerMove={tiltStack.onPointerMove} onPointerLeave={tiltStack.onPointerLeave} className="mx-auto w-[min(330px,80%)] [perspective:1500px]">
              <div className="relative aspect-[3/4] [transform-style:preserve-3d]" style={{ transform: 'rotateX(var(--rx,6deg)) rotateY(var(--ry,-10deg))', transition: 'transform .25s ease-out' }}>
                {[{ r: -7, z: 0, p: 'sky' as const }, { r: 4, z: 26, p: 'blush' as const }, { r: -1, z: 52, p: 'lime' as const }].map((sheet, i) => (
                  <div key={i} className="absolute inset-0 shadow-lift" style={{ transform: `translateZ(${sheet.z}px) rotate(${sheet.r}deg)` }}>
                    <LetterSheet paper={sheet.p} issue={i === 2 ? 'No. 08' : ''} title={i === 2 ? 'Slow mornings' : ''} className="h-full"><p>{i === 2 ? 'Write to someone you have not spoken to in a while.' : ''}</p></LetterSheet>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="graph">
          <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 md:py-28">
            <h2 className="display text-[clamp(38px,5vw,62px)]">How it works</h2>
            <ol className="relative mt-16 grid list-none gap-12 p-0 md:grid-cols-3">
              <div className="absolute left-[10%] right-[10%] top-[62px] hidden border-t-[3px] border-dashed border-navy/40 md:block" aria-hidden="true" />
              {[
                { n: 1, tone: 'tomato' as const, art: 'flower' as const, t: 'Pick a format', p: 'Start from a letter, postcard, photo card, collage or memory page.' },
                { n: 2, tone: 'cobalt' as const, art: 'sun' as const, t: 'Write and decorate', p: 'Type your words, drop in photos, add stamps and stickers, and choose the paper and ink.' },
                { n: 3, tone: 'moss' as const, art: 'heart' as const, t: 'Print or share', p: 'Your draft saves in this browser. Print it at true size or export a picture.' },
              ].map((step) => (
                <li key={step.n} className="relative flex flex-col items-center text-center">
                  <div className="w-[96px] rotate-[-4deg]"><Stamp tone={step.tone} art={step.art} lines={[String(step.n)]} label={`Step ${step.n}`} /></div>
                  <h3 className="display mt-6 text-[26px]">{step.t}</h3>
                  <p className="mt-2 max-w-[19rem] text-[17px] leading-relaxed text-muted">{step.p}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="on-dark relative overflow-hidden bg-cobalt text-paper">
          <div className="mx-auto max-w-[900px] px-5 py-24 text-center md:py-32">
            <h2 className="display text-[clamp(44px,7vw,88px)]">Start with a blank page.</h2>
            <p className="mx-auto mt-5 max-w-[30rem] text-[19px] text-paper/85">No account needed. Your draft stays in this browser.</p>
            <Link to="/app/create" className="btn btn-saffron mt-9">Open the studio <ArrowUpRight size={18} /></Link>
          </div>
          <div className="pointer-events-none absolute left-[4%] top-[18%] hidden w-[110px] rotate-[-10deg] md:block" aria-hidden="true"><Stamp tone="saffron" art="sun" lines={['HELLO']} label="" /></div>
          <div className="pointer-events-none absolute bottom-[14%] right-[5%] hidden w-[120px] rotate-[9deg] md:block" aria-hidden="true"><Stamp tone="bubblegum" art="heart" lines={['LUMIE']} label="" /></div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  )
}
