import type { ReactNode } from 'react'

export type EnvelopeTone = 'tomato' | 'gold' | 'moss' | 'cobalt' | 'bubblegum'

export default function Envelope({ tone = 'tomato', open = false, children, className }: { tone?: EnvelopeTone; open?: boolean; children?: ReactNode; className?: string }) {
  return (
    <div className={`env env-${tone} ${open ? 'is-open' : ''} ${className ?? ''}`}>
      <div className="env-back" />
      <div className="env-flap" aria-hidden="true"><span className="f-out" /><span className="f-in" /></div>
      <div className="env-slot">{children}</div>
      <div className="env-front" />
    </div>
  )
}
