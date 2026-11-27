import { useState } from 'react'
import type { FormEvent } from 'react'
import { Copy, MessageCircle, WandSparkles } from 'lucide-react'
import { requestAssistant } from '../assistant/assistantProvider'
import type { AssistantSuggestion, AssistantTask } from '../assistant/assistantTypes'

export default function StudioAssistant() {
  const [mode, setMode] = useState<AssistantTask>('writing.start')
  const [brief, setBrief] = useState('')
  const [suggestion, setSuggestion] = useState<AssistantSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const getSuggestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setCopied(false)
    try {
      const response = await requestAssistant({ task: mode, input: brief.trim() })
      setSuggestion(response.suggestions[0] ?? null)
    } finally {
      setLoading(false)
    }
  }

  const copySuggestion = async () => {
    if (!suggestion) return
    try { await navigator.clipboard.writeText(suggestion.content); setCopied(true) }
    catch { setCopied(false) }
  }

  return (
    <section className="studio-assistant" aria-labelledby="studio-assistant-title">
      <div className="studio-assistant-heading">
        <span className="studio-assistant-icon"><WandSparkles size={17} aria-hidden="true" /></span>
        <div><h3 id="studio-assistant-title">Lumie assistant</h3><p>A second pair of eyes, whenever you want one.</p></div>
      </div>
      <span className="studio-assistant-status">HERE WHEN YOU NEED A HAND</span>
      <form onSubmit={getSuggestion} className="studio-assistant-form">
        <label htmlFor="studio-assistant-mode">What would you like help with?</label>
        <select id="studio-assistant-mode" value={mode} onChange={(event) => { setMode(event.target.value as AssistantTask); setSuggestion(null) }}>
          <option value="writing.start">Help me get started</option>
          <option value="writing.tone">Explore a different tone</option>
          <option value="design.direction">Find a visual direction</option>
        </select>
        <label htmlFor="studio-assistant-brief">A little context <span>(optional)</span></label>
        <textarea id="studio-assistant-brief" value={brief} onChange={(event) => setBrief(event.target.value)} rows={3} maxLength={500} placeholder="What are you making, and what do you want it to feel like?" />
        <button type="submit" className="studio-assistant-submit" disabled={loading}><MessageCircle size={15} /> {loading ? 'Putting together an example' : 'Show me an example'}</button>
      </form>
      {suggestion && <div className="studio-assistant-response" aria-live="polite"><p className="studio-assistant-response-label">A THOUGHT TO GET YOU STARTED</p><h4>{suggestion.label}</h4>{brief.trim() && <p className="studio-assistant-context">Your brief: “{brief.trim()}”</p>}<p>{suggestion.content}</p><button type="button" onClick={copySuggestion} className="studio-assistant-copy"><Copy size={14} /> {copied ? 'Copied' : 'Copy suggestion'}</button></div>}
    </section>
  )
}
