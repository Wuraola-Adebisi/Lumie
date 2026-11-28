import { Bell, Mail } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthProvider'
import { getEmailNotificationPreferences, updateEmailNotificationPreferences } from '../features/creations/cloudApi'

export default function NotificationSettingsPage() {
  const { getToken } = useAuth()
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const preferences = await getEmailNotificationPreferences(getToken)
      setEnabled(preferences.emailCorrespondence)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your notification settings could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { void load() }, [load])

  const save = async (next: boolean) => {
    const previous = enabled
    setEnabled(next)
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const saved = await updateEmailNotificationPreferences(getToken, { emailCorrespondence: next })
      setEnabled(saved.emailCorrespondence)
      setNotice('Your email preference has been updated.')
    } catch (reason) {
      setEnabled(previous)
      setError(reason instanceof Error ? reason.message : 'Your notification setting could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="max-w-[760px]">
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.14em] text-cobalt"><Bell size={16} /> YOUR ACCOUNT</p>
      <h1 className="display mt-2 text-[clamp(34px,5vw,54px)]">Email preferences</h1>
      <p className="mt-3 max-w-[38rem] text-[17px] leading-relaxed text-muted">Choose which correspondence updates reach your inbox. Your letters and replies always remain in Lumie.</p>

      {loading ? <p className="mt-8 text-sm text-muted">Loading your preferences…</p> : (
        <div className="mt-9 rounded-2xl border-2 border-navy/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-saffron/40 text-navy"><Mail size={22} /></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-ink">New letters and replies</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">Receive an email when someone sends you correspondence or replies to a letter. The email tells you a letter is waiting; its contents stay in your private inbox.</p>
              <label className="mt-5 flex w-fit cursor-pointer items-center gap-3 text-sm font-bold text-ink">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#3157c8]"
                  checked={enabled}
                  disabled={saving}
                  onChange={(event) => void save(event.target.checked)}
                />
                Email me about new correspondence
              </label>
            </div>
          </div>
          {saving && <p className="mt-5 text-sm text-muted" role="status">Saving…</p>}
          {notice && <p className="mt-5 text-sm font-medium text-cobalt" role="status">{notice}</p>}
          {error && <div className="mt-5"><p className="text-sm font-semibold text-tomato" role="alert">{error}</p><button type="button" className="mt-2 text-sm font-bold text-cobalt underline" onClick={() => void load()}>Try again</button></div>}
        </div>
      )}
    </section>
  )
}
