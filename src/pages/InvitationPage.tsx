import { useEffect, useRef, useState } from 'react'
import { ArrowRight, MailOpen } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import BrandMark from '../components/mail/BrandMark'
import { useAuth } from '../features/auth/AuthProvider'
import { acceptCorrespondenceInvitation, CloudApiError } from '../features/creations/cloudApi'

export default function InvitationPage() {
  const { token = '' } = useParams()
  const { status, configured, getToken, signOut } = useAuth()
  const navigate = useNavigate()
  const started = useRef(false)
  const [phase, setPhase] = useState<'waiting' | 'accepting' | 'accepted' | 'error'>('waiting')
  const [threadId, setThreadId] = useState('')
  const [senderName, setSenderName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex,nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    if (status !== 'authenticated' || !token || started.current) return
    started.current = true
    setPhase('accepting')
    acceptCorrespondenceInvitation(getToken, token)
      .then(result => {
        setThreadId(result.threadId)
        setSenderName(result.senderName || 'A Lumie member')
        setPhase('accepted')
      })
      .catch(reason => {
        setError(reason instanceof CloudApiError ? reason.message : reason instanceof Error ? reason.message : 'This invitation could not be opened.')
        setPhase('error')
      })
  }, [status, token, getToken])

  const returnToSignIn = async () => {
    await signOut()
    navigate('/sign-in', { state: { from: `/invite/${token}` }, replace: true })
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6 py-12">
      <section className="w-full max-w-[460px]">
        <Link to="/" aria-label="Lumie home" className="inline-block"><BrandMark /></Link>
        <div className="mt-12 rounded-2xl border-2 border-navy bg-white p-7 shadow-[0_5px_0_#121c5a] sm:p-9">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-saffron text-navy"><MailOpen size={22}/></span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[.14em] text-cobalt">A LETTER FOR YOU</p>
          {phase === 'accepted' ? <>
            <h1 className="display mt-2 text-4xl">It found its way to you.</h1>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">{senderName} has sent you a letter. It is now waiting in your inbox.</p>
            <button type="button" className="btn btn-primary mt-7 w-full" onClick={() => navigate('/app/inbox')}>Open your inbox <ArrowRight size={17}/></button>
          </> : phase === 'accepting' ? <>
            <h1 className="display mt-2 text-4xl">Opening your letter.</h1>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">We are adding this correspondence to your inbox.</p>
          </> : phase === 'error' ? <>
            <h1 className="display mt-2 text-4xl">This invitation needs attention.</h1>
            <p role="alert" className="mt-4 text-[16px] leading-relaxed text-muted">{error}</p>
            {error.includes('email address') && <button type="button" className="btn btn-paper mt-6 w-full" onClick={() => void returnToSignIn()}>Switch account</button>}
            <Link to="/" className="mt-6 inline-block text-sm font-bold text-cobalt underline">Back to Lumie</Link>
          </> : status === 'unauthenticated' ? <>
            <h1 className="display mt-2 text-4xl">Someone has written to you.</h1>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">Sign in with the email address this invitation was sent to, or create an account with that address to receive the letter.</p>
            <Link to="/sign-in" state={{ from: `/invite/${token}` }} className="btn btn-primary mt-7 w-full">Sign in or create an account <ArrowRight size={17}/></Link>
          </> : <>
            <h1 className="display mt-2 text-4xl">A letter is on its way.</h1>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">{configured ? 'Checking your invitation…' : 'Lumie sign-in is temporarily unavailable.'}</p>
          </>}
        </div>
      </section>
    </main>
  )
}
