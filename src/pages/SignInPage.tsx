import { ArrowRight, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import BrandMark from '../components/mail/BrandMark'
import { useAuth } from '../features/auth/AuthProvider'

type Mode = 'sign-in' | 'sign-up' | 'forgot-password'

export default function SignInPage() {
  const { configured, signIn, signUp, requestPasswordReset } = useAuth()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const location = useLocation()
  const destination = (location.state as { from?: string } | null)?.from || '/app'

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      if (mode === 'forgot-password') {
        await requestPasswordReset(email)
        setNotice('If an account exists for that email, a password reset link is on its way.')
      } else if (mode === 'sign-up') {
        sessionStorage.setItem('lumie-after-sign-in', destination)
        const result = await signUp(email, password, displayName)
        if (result.needsEmailConfirmation) setNotice('Check your email for a confirmation link. Once confirmed, you can sign in to your desk.')
        else window.location.assign(destination)
      } else {
        await signIn(email, password)
        window.location.assign(destination)
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The request could not be completed.')
    } finally { setBusy(false) }
  }

  const heading = mode === 'sign-in' ? 'Come on in.' : mode === 'sign-up' ? 'Your desk awaits.' : 'A fresh start.'
  const eyebrow = mode === 'sign-in' ? 'WELCOME BACK' : mode === 'sign-up' ? 'MAKE YOURSELF AT HOME' : 'ACCOUNT RECOVERY'
  const description = mode === 'forgot-password'
    ? 'Enter the email address linked to your account. We will send you a link to choose a new password.'
    : 'Sign in or create an account to open your desk.'

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
          <p className="font-bold text-cobalt">{eyebrow}</p>
          <h2 className="display mt-3 text-4xl">{heading}</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted">{description}</p>
          {!configured ? (
            <p role="alert" className="mt-8 rounded-xl border border-tomato/40 bg-tomato/10 p-4 text-sm">Lumie sign-in is temporarily unavailable.</p>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={submit}>
              {mode === 'sign-up' && <label className="block text-sm font-semibold text-ink">Your name<input className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/15" autoComplete="name" required maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>}
              <label className="block text-sm font-semibold text-ink">Email address<input className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/15" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              {mode !== 'forgot-password' && <label className="block text-sm font-semibold text-ink">Password<input className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/15" type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
              <button type="submit" className="btn btn-primary w-full" disabled={busy}>
                <Mail size={18}/>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : mode === 'sign-up' ? 'Create account' : 'Send reset link'}<ArrowRight size={17}/>
              </button>
            </form>
          )}
          {mode === 'sign-in' && configured && <button type="button" className="mt-4 text-sm font-bold text-cobalt underline" onClick={() => { setMode('forgot-password'); setError(''); setNotice('') }}>Forgot your password?</button>}
          {notice && <p role="status" className="mt-4 rounded-xl border border-cobalt/20 bg-cobalt/5 p-3 text-sm leading-relaxed">{notice}</p>}
          {error && <p role="alert" className="mt-4 text-sm font-semibold text-tomato">{error}</p>}
          <p className="mt-6 text-sm text-muted">
            {mode === 'forgot-password' ? 'Remember your password?' : mode === 'sign-in' ? 'New to Lumie?' : 'Already have an account?'}{' '}
            <button type="button" className="font-bold text-cobalt underline" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); setNotice('') }}>
              {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
          <Link to="/" className="mt-8 inline-block text-sm font-bold text-cobalt hover:underline">Back to Lumie</Link>
        </div>
      </section>
    </main>
  )
}
