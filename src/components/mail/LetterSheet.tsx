import type { ReactNode } from 'react'

interface Props { issue?: string; title: string; children: ReactNode; sign?: string; paper?: 'lime' | 'cream' | 'blush' | 'sky'; className?: string }

/** A typewritten sheet in the style of a monthly mail-club letter. */
export default function LetterSheet({ issue, title, children, sign, paper = 'lime', className }: Props) {
  return (
    <div className={`letter letter-${paper} ${className ?? ''}`}>
      <div className="letter-in">
        <div className="letter-head"><span>{issue}</span><span className="letter-rule" /></div>
        <h3 className="letter-title">{title}</h3>
        <div className="letter-body">{children}</div>
        {sign && <p className="letter-sign">{sign}</p>}
      </div>
    </div>
  )
}
