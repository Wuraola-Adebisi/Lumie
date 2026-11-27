import { ArrowUpRight, Lock, Mail, Palette, Users, WandSparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicPageLayout from '../components/marketing/PublicPageLayout'

const cards = 'rounded-2xl border-2 border-navy p-7 shadow-[0_4px_0_#121c5a]'
const principles = [
  { icon: Users, t: 'Open to everyone', p: 'Lumie does not assume who is writing, who is reading or how they know each other.' },
  { icon: Palette, t: 'Creative freedom', p: 'A short note, a long letter, a collage or a page of photos all work the same way.' },
  { icon: Lock, t: 'Private by default', p: 'Writing stays private until you choose to share it.' },
  { icon: Mail, t: 'Correspondence, not chat', p: 'Letters are made to be read and returned to, without pressure to reply at once.' },
  { icon: WandSparkles, t: 'A helping hand, not a replacement', p: 'Lumie is being designed with an assistant for ideas, phrasing and creative direction. Your words and decisions stay yours.' },
]

export default function AboutPage() {
  return (
    <PublicPageLayout title="About Lumie" intro="Lumie is a creative correspondence space for making meaningful things, with an assistant to help when you want another perspective.">
      <section className="grid gap-5 md:grid-cols-2">
        <div className={`${cards} bg-tomato`}><h2 className="display text-[28px]">Why it exists</h2><p className="mt-3 text-[17px] leading-relaxed">Most digital conversations move quickly. Lumie makes room for the things you want to take more time over: a letter, a postcard from an ordinary Tuesday, or a page of memories made with someone. You can write every word yourself, or bring in the assistant when you need help getting started or finding the right shape.</p></div>
        <div className={`${cards} bg-lilac`}><h2 className="display text-[28px]">What it borrows from the post</h2><p className="mt-3 text-[17px] leading-relaxed">Stamps, postmarks, envelopes and paper stock, rebuilt on screen. The visual language is playful; the ways you can write and design remain open.</p></div>
      </section>
      <section className="mt-20">
        <h2 className="display text-[clamp(30px,4vw,44px)]">What it is built on</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {principles.map(({ icon: Icon, t, p }) => <article key={t} className="rounded-2xl border-2 border-navy bg-paper p-6 shadow-[0_4px_0_#121c5a]"><Icon className="text-cobalt" size={26} /><h3 className="display mt-4 text-[21px]">{t}</h3><p className="mt-2 text-[16px] leading-relaxed text-muted">{p}</p></article>)}
        </div>
      </section>
      <section className="mt-20 rounded-2xl border-2 border-navy bg-saffron p-8 shadow-[0_4px_0_#121c5a] md:flex md:items-center md:justify-between md:gap-10">
        <div className="max-w-[560px]">
          <h2 className="display text-[28px]">Make your first piece</h2>
          <p className="mt-3 text-[16px] leading-relaxed">Choose a format, write in your own voice and make the page yours. Try the assistant preview if you want a little help.</p>
        </div>
        <Link className="btn btn-primary mt-6 md:mt-0" to="/app/create">Open the studio <ArrowUpRight size={16} /></Link>
      </section>
    </PublicPageLayout>
  )
}
