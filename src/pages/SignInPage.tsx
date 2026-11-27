import { ArrowRight, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import BrandMark from '../components/mail/BrandMark'
import { useAuth } from '../features/auth/AuthProvider'

export default function SignInPage() {
  const { configured, signIn, error: authError } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()
  const destination = (location.state as { from?: string } | null)?.from || '/app'

  const start = async () => {
    setBusy(true)
    setError('')
    try {
      sessionStorage.setItem('lumie-after-sign-in', destination)
      await signIn()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not start sign-in.')
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-cream md:grid-cols-[1.05fr_.95fr]">
      <section className="flex flex-col justify-between bg-cobalt p-7 text-paper md:p-12">
        <Link to="/" aria-label="Lumie home" className="w-fit"><BrandMark /></Link>
        <div className="my-16 max-w-xl">
          <p className="font-bold uppercase tracking-[.18em] text-saffron">YOUR DESK, YOUR WORDS</p>
          <h1 className="display mt-5 text-[clamp(42px,6vw,72px)]">A little room for everything you want to say.</h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-paper/85">Keep your letters, postcards and personal pieces together, and pick up wherever you left off.</p>
        </div>
        <p className="text-sm text-paper/70">Lumie · A place for correspondence</p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[390px]">
          <p className="font-bold text-cobalt">WELCOME BACK</p>
          <h2 className="display mt-3 text-4xl">Come on in.</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted">Sign in or create an account to open your desk.</p>
          {!configured ? (
            <div className="mt-8 rounded-xl border border-tomato/40 bg-tomato/10 p-4 text-sm leading-relaxed">Sign-in is not configured for this environment. Add the OIDC settings from <code>.env.local.example</code> and restart the app.</div>
          ) : (
            <button type="button" className="btn btn-primary mt-8 w-full" onClick={start} disabled={busy}>
              <Mail size={18}/>{busy ? 'Opening sign-in…' : 'Continue to sign in'}<ArrowRight size={17}/>
            </button>
          )}
          {(error || authError) && <p role="alert" className="mt-4 text-sm font-semibold text-tomato">{error || authError}</p>}
          <p className="mt-8 text-sm text-muted">New to Lumie? The sign-in page includes an option to create your account.</p>
          <Link to="/" className="mt-8 inline-block text-sm font-bold text-cobalt hover:underline">Back to Lumie</Link>
        </div>
      </section>
    </main>
  )
}
