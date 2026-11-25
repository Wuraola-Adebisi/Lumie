import { Mail, MessageCircle } from 'lucide-react'
import PublicPageLayout from '../components/marketing/PublicPageLayout'

export default function ContactPage() {
  return (
    <PublicPageLayout eyebrow="GET IN TOUCH" title="A note to the mail room." intro="Questions, feedback and thoughtful suggestions help shape what Lumie becomes.">
      <section className="contact-status-card"><div className="contact-status-icon"><MessageCircle size={24}/></div><div><span className="section-kicker">PRE-RELEASE</span><h2>Our support inbox is not open yet.</h2><p>Lumie is still being built, and an official support email and contact workflow have not been configured. We won't publish a made-up address or collect your message through a form that doesn't actually send it.</p><p>Before public launch, this page will include a monitored contact address and a clear route for privacy, accessibility and safety enquiries.</p></div></section>
      <div className="contact-note"><Mail size={17}/><span>For now, please avoid sending personal, confidential or sensitive information to unofficial channels.</span></div>
    </PublicPageLayout>
  )
}
