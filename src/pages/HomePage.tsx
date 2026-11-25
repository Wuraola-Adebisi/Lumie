import { ArrowDown,ArrowRight,ArrowUpRight,Bookmark,Clock3,Heart,Images,Mail,MessageCircle,Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import MarketingHeader from '../components/marketing/MarketingHeader'
import MarketingFooter from '../components/marketing/MarketingFooter'

export default function HomePage(){
  return <div className="marketing-page"><MarketingHeader/><main>
    <section className="hero-section">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot"/> THE INTERNET'S LITTLE MAIL CLUB</div>
        <h1>Make a little<br/>magic. <em>Send</em><br/>it somewhere.</h1>
        <p className="hero-description">Letters, postcards, tiny memories and things worth keeping. Make them look like you, send them to your people, and give good words somewhere to live.</p>
        <div className="hero-actions"><Link to="/app" className="button button-dark">Join the mail club <ArrowUpRight size={17}/></Link><a href="#how-it-works" className="button button-quiet">Take a peek <ArrowDown size={15}/></a></div>
        <div className="hero-footnote"><span className="tiny-avatars"><i>J</i><i>M</i><i>A</i></span><span>For every kind of person, and every kind of connection.</span></div>
      </div>
      <div className="hero-art">
        <div className="postmark postmark-one">LUMIE<br/>MAIL CLUB <span>✳</span></div>
        <div className="art-back-card"><span>GREETINGS FROM</span><strong>somewhere<br/>lovely</strong><div className="back-card-doodle">✳</div><div className="back-card-lines"/></div>
        <div className="art-main-card">
          <div className="card-topline"><span>POSTCARD No. 008</span><span className="mini-stamp"><b>LU</b><i>✳</i></span></div>
          <div className="art-card-title">A little<br/><em>hello.</em></div>
          <div className="art-card-rule"/>
          <p>Just a small note to say you crossed my mind. Hope today is being kind to you.</p>
          <div className="art-card-bottom"><span>from somewhere with love</span><Heart size={17} fill="currentColor"/></div>
          <div className="postcard-cancel">LUMIE POST<br/>NOV 25 · 2026</div>
        </div>
        <div className="art-photo-card"><div className="photo-sun"/><div className="photo-hill"/><span>A day worth keeping</span><b>✳</b></div>
        <div className="art-note"><MessageCircle size={16}/><span>someone wrote back</span><i/></div>
        <div className="art-tape"/>
        <div className="floating-stamp"><span>POSTAGE</span><strong>LOVE</strong><i>✳</i></div>
      </div>
    </section>
    <div className="ticker"><span>MAKE SOMETHING GOOD</span><b>✳</b><span>PUT IT IN THE POST</span><b>✳</b><span>KEEP THE GOOD STUFF</span><b>✳</b><span>REPEAT OFTEN</span></div>
    <section className="intro-section section-wrap" id="why-lumie"><div className="section-kicker">A MAIL CLUB, WITH ROOM FOR EVERYONE</div><div className="intro-grid"><h2>Not just messages.<br/><em>Little keepsakes.</em></h2><p>Some things deserve more than a bubble in a chat. Make a postcard for no reason, send a letter that looks like you spent all afternoon on it, collect memories with your favourite people, or save a few words for later.</p></div></section>
    <section className="feature-section section-wrap" id="what-you-can-make"><div className="section-heading"><div><div className="section-kicker">PICK YOUR FORMAT. BREAK THE RULES.</div><h2>Make it a note.<br/>Make it a <em>whole thing.</em></h2></div><p>Go minimal or go full scrapbook. Your words, your layout, your little masterpiece.</p></div>
      <div className="feature-grid">
        <article className="feature-card feature-large feature-coral"><div className="feature-icon"><Mail/></div><div className="feature-visual letter-stack"><div className="stack-sheet stack-back"/><div className="stack-sheet stack-front"><span>HELLO FROM ME</span><strong>A little<br/>something.</strong><i>✳</i><b>POSTCARD</b></div></div><div><h3>Letters & postcards</h3><p>Designed, decorated, stamped and ready to make somebody's day.</p></div></article>
        <article className="feature-card feature-lilac"><div className="feature-icon"><Images/></div><div className="feature-visual memory-visual"><div className="memory-photo">a good day</div><span className="memory-caption">remember this?</span><span className="memory-star">✳</span></div><div><h3>Photo stories</h3><p>Turn pictures and words into keepsakes worth opening again.</p></div></article>
        <article className="feature-card feature-butter"><div className="feature-icon"><Clock3/></div><div className="feature-visual open-visual"><div className="open-envelope"><span>OPEN WHEN</span><strong>the day gets<br/>a little heavy</strong><i>✳</i><b>✉</b></div></div><div><h3>Open-when mail</h3><p>Leave something for a future day, a feeling or a person.</p></div></article>
        <article className="feature-card feature-sage"><div className="feature-icon"><Sparkles/></div><div className="feature-visual group-visual"><div className="group-note">A book of<br/><em>little things.</em><span>made by your people</span></div><div className="group-bubble">+ 08</div></div><div><h3>Group mail & memory books</h3><p>Invite your people to add a page, a photo or a few words.</p></div></article>
      </div>
    </section>
    <section className="how-section section-wrap" id="how-it-works"><div className="section-kicker">THREE LITTLE STEPS</div><h2>Make. Send.<br/><em>Make someone's day.</em></h2><div className="steps-grid"><div className="step"><span>01</span><div className="step-icon step-one"><Sparkles/></div><h3>Start with an idea</h3><p>Pick a postcard, a letter, a photo story or a blank canvas.</p></div><div className="step"><span>02</span><div className="step-icon step-two"><Bookmark/></div><h3>Make it yours</h3><p>Choose the type, colours, fonts, pictures, stamps and little details.</p></div><div className="step"><span>03</span><div className="step-icon step-three"><MessageCircle/></div><h3>Send it or save it</h3><p>Put it in someone's inbox, invite a reply or keep it in your collection.</p></div></div></section>
    <section className="closing-section"><div className="closing-doodle">✳</div><div className="section-kicker">THE WORLD COULD USE A LITTLE MORE MAIL</div><h2>You've got<br/><em>something to send.</em></h2><p>Come make a little something of it.</p><Link to="/app" className="button button-dark">Step inside Lumie <ArrowRight size={17}/></Link></section>
  </main><MarketingFooter/></div>
}
