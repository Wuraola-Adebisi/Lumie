import { Mail, MessageCircle } from 'lucide-react'
import PublicPageLayout from '../components/marketing/PublicPageLayout'

export default function ContactPage() {
  return (
    <PublicPageLayout title="Contact" intro="Questions, feedback and suggestions help shape what Lumie becomes." stamp={{ tone: 'saffron', art: 'heart' }}>
      <section className="grid gap-5 rounded-2xl border-2 border-navy bg-lilac p-7 shadow-[0_4px_0_#121c5a] sm:grid-cols-[60px_1fr]">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-paper"><MessageCircle size={26} /></span>
        <div>
          <h2 className="display text-[28px]">The support inbox is not open yet.</h2>
          <p className="mt-3 max-w-[640px] text-[17px] leading-relaxed">Lumie is still being built and no official support address has been set up. This page will not show a made-up address or a form that does not send.</p>
          <p className="mt-3 max-w-[640px] text-[17px] leading-relaxed">Before launch it will list a monitored address and a route for privacy, accessibility and safety questions.</p>
        </div>
      </section>
      <p className="mt-6 flex items-start gap-3 rounded-xl border-2 border-navy/20 bg-paper p-4 text-[15px] leading-relaxed text-muted"><Mail className="mt-0.5 shrink-0 text-cobalt" size={18} />Until then, avoid sending personal or sensitive information through unofficial channels.</p>
    </PublicPageLayout>
  )
}
