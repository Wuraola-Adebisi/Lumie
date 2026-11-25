import { ArrowUpRight, Image, Mail, Palette, Save, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicPageLayout from '../components/marketing/PublicPageLayout'

const steps = [
  { number: '01', icon: Palette, title: 'Choose a starting point', body: 'Begin with a letter, postcard, photo card, collage or memory page. The format gives you a starting shape, not a set of rules.' },
  { number: '02', icon: Image, title: 'Make it yours', body: 'Add your words, change the typeface and ink, choose a paper colour, place a stamp, add a decoration or bring in a photo.' },
  { number: '03', icon: Save, title: 'Keep your composition', body: 'Your current draft is saved in this browser on this device. You can return to it here, duplicate it, undo changes or print it.' },
  { number: '04', icon: Mail, title: 'Make room for the exchange', body: 'Lumie is being designed for sending, receiving and replying to correspondence. Those connected features are not available in this first release.' },
  { number: '05', icon: Users, title: 'Collect things together', body: 'Shared memory books and guest contributions are part of the product direction. Invitations and shared permissions are still to come.' },
]

export default function HowItWorksPage() {
  return (
    <PublicPageLayout eyebrow="HOW THE MAIL CLUB WORKS" title="A little making. A little keeping. A lot of room." intro="Lumie brings creative writing and the feeling of personal mail together. Here's how the experience is intended to work, and what you can use today.">
      <div className="public-step-list">{steps.map(({ number, icon: Icon, title, body }) => <article className="public-step" key={number}><div className="public-step-number">{number}</div><div className="public-step-icon"><Icon size={21}/></div><div><h2>{title}</h2><p>{body}</p></div></article>)}</div>
      <section className="public-note-panel"><span className="section-kicker">AVAILABLE NOW</span><h2>Try making something.</h2><p>The Creation Studio currently supports five formats, editable text layers, stamps, decorations, local photo uploads, paper colours, undo and redo, local draft saving and browser printing. Drafts are not uploaded or synchronised to another device.</p><Link className="button button-dark" to="/app/create">Open the Creation Studio <ArrowUpRight size={15}/></Link></section>
    </PublicPageLayout>
  )
}
