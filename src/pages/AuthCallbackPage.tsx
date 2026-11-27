import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

export default function AuthCallbackPage() {
  const { completeCallback } = useAuth()
  const navigate = useNavigate()
  const started = useRef(false)
  const [error, setError] = useState('')
  const flow = new URLSearchParams(window.location.search).get('flow') || sessionStorage.getItem('lumie-auth-flow')

  useEffect(() => {
    if (started.current) return
    started.current = true
    completeCallback(window.location.search + window.location.hash)
      .then(() => {
        if (flow === 'recovery') {
          sessionStorage.removeItem('lumie-auth-flow')
          navigate('/reset-password', { replace: true })
          return
        }
        const destination = sessionStorage.getItem('lumie-after-sign-in') || '/app'
        sessionStorage.removeItem('lumie-after-sign-in')
        navigate(destination, { replace: true })
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Sign-in could not be completed.'))
  }, [completeCallback, flow, navigate])

  if (error) return <main className="grid min-h-screen place-items-center bg-cream px-6"><div className="max-w-md text-center"><h1 className="display text-3xl">We could not open your desk.</h1><p role="alert" className="mt-3 text-muted">{error}</p><a href="/sign-in" className="btn btn-primary mt-6">Try again</a></div></main>
  return <main className="grid min-h-screen place-items-center bg-cream"><p className="font-bold text-muted">Finishing sign-in…</p></main>
}
