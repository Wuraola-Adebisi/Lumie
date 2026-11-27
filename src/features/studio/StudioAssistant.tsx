import { useState } from 'react'
import { Copy, MessageCircle, WandSparkles } from 'lucide-react'

type AssistantMode = 'start' | 'tone' | 'design'
const examples: Record<AssistantMode, { title: string; response: string }> = {
  start: { title: 'A place to begin', response: 'Start with one thing you remember clearly. What happened, what did it mean to you, and what do you want the other person to know? You do not need the perfect opening yet. Try: “I keep thinking about the time we…”' },
  tone: { title: 'A tone to try', response: 'Keep the message direct, then soften the edges with one specific detail. Say what you mean in your own words; you do not need to make every sentence sound polished.' },
  design: { title: 'A visual direction', response: 'Try a postcard with a warm paper base, one strong photograph, a short handwritten heading and a small stamp in the corner. Let the image do some of the talking and leave breathing room around the message.' },
}

export default function StudioAssistant() {
  const [mode, setMode] = useState<AssistantMode>('start')
  const [brief, setBrief] = useState('')
  const [shown, setShown] = useState(false)
  const [copied, setCopied] = useState(false)
  const suggestion = examples[mode]
  const preview = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); setShown(true); setCopied(false) }
  const copySuggestion = async () => {
    try { await navigator.clipboard.writeText(suggestion.response); setCopied(true) }
    catch { setCopied(false) }
  }
  return (
    <section className="studio-assistant" aria-labelledby="studio-assistant-title">
      <div className="studio-assistant-heading">
        <span className="studio-assistant-icon"><WandSparkles size={17} aria-hidden="true" /></span>
        <div><h3 id="studio-assistant-title">Lumie assistant</h3><p>A second pair of eyes, whenever you want one.</p></div>
      </div>
      <span className="studio-assistant-status">ASSISTANT PREVIEW · SAMPLE RESPONSES</span>
      <form onSubmit={preview} className="studio-assistant-form">
        <label htmlFor="studio-assistant-mode">What would you like help with?</label>
        <select id="studio-assistant-mode" value={mode} onChange={(event) => { setMode(event.target.value as AssistantMode); setShown(false) }}>
          <option value="start">Help me get started</option><option value="tone">Explore a different tone</option><option value="design">Find a visual direction</option>
        </select>
        <label htmlFor="studio-assistant-brief">A little context <span>(optional)</span></label>
        <textarea id="studio-assistant-brief" value={brief} onChange={(event) => setBrief(event.target.value)} rows={3} maxLength={500} placeholder="What are you making, and what do you want it to feel like?" />
        <button type="submit" className="studio-assistant-submit"><MessageCircle size={15} /> Show me an example</button>
      </form>
      {shown && <div className="studio-assistant-response" aria-live="polite"><p className="studio-assistant-response-label">A SAMPLE IDEA FOR YOU</p><h4>{suggestion.title}</h4>{brief.trim() && <p className="studio-assistant-context">Your brief: “{brief.trim()}”</p>}<p>{suggestion.response}</p><button type="button" onClick={copySuggestion} className="studio-assistant-copy"><Copy size={14} /> {copied ? 'Copied' : 'Copy suggestion'}</button></div>}
      <p className="studio-assistant-note">This preview uses fixed sample responses. Your prompt is not sent to an AI model. Live AI will be connected after the infrastructure is in place.</p>
    </section>
  )
}
