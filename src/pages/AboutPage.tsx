import { ArrowUpRight, Mail, Palette, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicPageLayout from '../components/marketing/PublicPageLayout'

export default function AboutPage() {
  return (
    <PublicPageLayout eyebrow="A LITTLE ABOUT US" title="Good things deserve somewhere to live." intro="Lumie is a creative correspondence space for the notes, letters, photographs and memories that mean something to us.">
      <section className="public-story-grid">
        <div className="public-story-card public-story-coral"><span>01 / THE IDEA</span><h2>Make room for the things you want to say.</h2><p>Most of our conversations happen quickly. Lumie is being made for the things that deserve a little more attention: a thoughtful letter, a postcard from an ordinary Tuesday, a note you want to keep, or a collection of memories made together.</p></div>
        <div className="public-story-card public-story-lilac"><span>02 / THE FEELING</span><h2>A mail club for the internet age.</h2><p>We borrow the joy of physical mail: the anticipation, the little details, the feeling of holding something made with care. Then we give that feeling room to be colourful, personal and entirely your own.</p></div>
      </section>
      <section className="public-content-section"><div className="section-kicker">WHAT WE BELIEVE</div><h2>Thoughtful by design.</h2><div className="public-principles">
        <article><Palette/><h3>Creative freedom</h3><p>Your words can be simple or elaborate. Make a letter, a collage, a photo story or something that does not fit a template.</p></article>
        <article><ShieldCheck/><h3>Privacy with intention</h3><p>Private writing should start private. Sharing should be a deliberate choice, with clear information about who can see what.</p></article>
        <article><Mail/><h3>Correspondence, not pressure</h3><p>We want to make thoughtful exchanges feel good, without turning every message into another demand for instant attention.</p></article>
      </div></section>
      <section className="public-status-panel"><div><span className="section-kicker">WHERE LUMIE IS TODAY</span><h2>We're building the mail room, one thoughtful piece at a time.</h2><p>The Creation Studio is the first working part of Lumie. At this stage, compositions and drafts are saved in the browser on the device where they are created. Accounts, cloud sync, sending, receiving and shared collections are not active yet.</p></div><Link className="button button-dark" to="/app/create">Explore the Creation Studio <ArrowUpRight size={15}/></Link></section>
    </PublicPageLayout>
  )
}
