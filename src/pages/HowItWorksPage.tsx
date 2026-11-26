import { ArrowUpRight, Image, Palette, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicPageLayout from '../components/marketing/PublicPageLayout'

const steps = [
  { icon: Palette, title: 'Choose a starting point', body: 'Begin with a letter, postcard, photo card, collage or memory page. The format sets the size and shape. Everything on it can change.' },
  { icon: Image, title: 'Make it yours', body: 'Edit the words, change the typeface and ink, pick a paper, place a stamp or sticker and add photos from your device.' },
  { icon: Save, title: 'Keep, print or share', body: 'Your draft is saved in this browser. Print it at true size, save a PDF, or export a picture of it laid out on a desk.' },
]

export default function HowItWorksPage() {
  return (
    <PublicPageLayout title="How Lumie works" intro="Three steps from a blank page to something you can print or share." stamp={{ tone: 'cobalt', art: 'sun' }}>
      <ol className="m-0 list-none p-0">
        {steps.map(({ icon: Icon, title, body }, index) => (
          <li key={title} className="grid grid-cols-[48px_1fr] gap-5 border-b-2 border-dashed border-navy/25 py-7 sm:grid-cols-[56px_64px_1fr]">
            <span className="display hidden text-[30px] text-cobalt sm:block">{index + 1}</span>
            <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-navy bg-lilac shadow-[0_3px_0_#121c5a]"><Icon size={22} /></span>
            <div><h2 className="display text-[24px]">{title}</h2><p className="mt-2 max-w-[600px] text-[17px] leading-relaxed text-muted">{body}</p></div>
          </li>
        ))}
      </ol>
      <section className="mt-14 rounded-2xl border-2 border-navy bg-lime p-8 shadow-[0_4px_0_#121c5a]">
        <h2 className="display text-[28px]">In the studio</h2>
        <p className="mt-3 max-w-[640px] text-[17px] leading-relaxed">Five formats, editable text layers, stamps, stickers, photo uploads, paper colours, undo and redo, a 3D view, print and PDF output, and share images.</p>
        <Link className="btn btn-primary mt-6" to="/app/create">Open the studio <ArrowUpRight size={16} /></Link>
      </section>
    </PublicPageLayout>
  )
}
