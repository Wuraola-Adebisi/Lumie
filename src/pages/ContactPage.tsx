import { MessageCircle } from 'lucide-react'
import PublicPageLayout from '../components/marketing/PublicPageLayout'

export default function ContactPage() {
  return (
    <PublicPageLayout title="Contact" intro="Questions, feedback and suggestions are welcome." stamp={{ tone: 'saffron', art: 'heart' }}>
      <section className="grid gap-5 rounded-2xl border-2 border-navy bg-lilac p-7 shadow-[0_4px_0_#121c5a] sm:grid-cols-[60px_1fr]">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-paper"><MessageCircle size={26} /></span>
        <div>
          <h2 className="display text-[28px]">Write to Lumie</h2>
          <p className="mt-3 max-w-[640px] text-[17px] leading-relaxed">Contact details will be listed on this page.</p>
        </div>
      </section>
    </PublicPageLayout>
  )
}
