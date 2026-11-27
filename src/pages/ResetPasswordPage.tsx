import { useEffect, useState } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import BrandMark from '../components/mail/BrandMark'
import { useAuth } from '../features/auth/AuthProvider'

export default function ResetPasswordPage() {
  const { status, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') navigate('/sign-in', { replace: true })
  }, [status, navigate])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirm) { setError('Those passwords do not match.'); return }
    setBusy(true); setError('')
    try {
      await updatePassword(password)
      setSaved(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your password could not be changed.')
    } finally { setBusy(false) }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6 py-12">
      <section className="w-full max-w-[420px]">
        <Link to="/" aria-label="Lumie home" className="inline-block"><BrandMark /></Link>
        <div className="mt-12 rounded-2xl border-2 border-navy bg-white p-7 shadow-[0_5px_0_#121c5a] sm:p-9">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-saffron text-navy"><LockKeyhole size={22}/></span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[.14em] text-cobalt">ACCOUNT RECOVERY</p>
          <h1 className="display mt-2 text-4xl">Choose a new password.</h1>
          {saved ? (
            <div className="mt-5">
              <p role="status" className="text-[16px] leading-relaxed text-muted">Your password has been updated. Your desk is ready.</p>
              <button type="button" className="btn btn-primary mt-6 w-full" onClick={() => navigate('/app', { replace: true })}>Open your desk <ArrowRight size={17}/></button>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={submit}>
              <label className="block text-sm font-semibold text-ink">New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-base outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/15"/></label>
              <label className="block text-sm font-semibold text-ink">Confirm new password<input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={event => setConfirm(event.target.value)} className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-base outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/15"/></label>
              {error && <p role="alert" className="text-sm font-semibold text-tomato">{error}</p>}
              <button type="submit" disabled={busy || status !== 'authenticated'} className="btn btn-primary w-full">{busy ? 'Updating…' : 'Update password'} <ArrowRight size={17}/></button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
