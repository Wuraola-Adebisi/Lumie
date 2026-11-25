import type { ReactNode } from 'react'
import type { StudioRichTextMark, StudioRichTextNode } from './studioTypes'

function safeHref(href?: string) {
  if (!href) return undefined
  try {
    const url = new URL(href, window.location.origin)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? href : undefined
  } catch {
    return undefined
  }
}

function renderText(text: string, marks: StudioRichTextMark[] = []): ReactNode {
  return marks.reduce<ReactNode>((node, mark, index) => {
    switch (mark.type) {
      case 'bold': return <strong key={index}>{node}</strong>
      case 'italic': return <em key={index}>{node}</em>
      case 'strike': return <s key={index}>{node}</s>
      case 'code': return <code key={index}>{node}</code>
      case 'link': {
        const href = safeHref(mark.attrs?.href)
        return href ? <a key={index} href={href} target={mark.attrs?.target === '_blank' ? '_blank' : undefined} rel="noopener noreferrer">{node}</a> : node
      }
      default: return node
    }
  }, text)
}

function renderNode(node: StudioRichTextNode, index: number): ReactNode {
  if (node.type === 'text') return <span key={index}>{renderText(node.text ?? '', node.marks)}</span>
  if (node.type === 'hardBreak') return <br key={index}/>
  const children = (node.content ?? []).map((child, childIndex) => renderNode(child, childIndex))
  const align = node.attrs?.textAlign
  const style = align ? { textAlign: align } as const : undefined
  switch (node.type) {
    case 'heading': return node.attrs?.level === 3 ? <h3 key={index} style={style}>{children}</h3> : <h2 key={index} style={style}>{children}</h2>
    case 'bulletList': return <ul key={index}>{children}</ul>
    case 'orderedList': return <ol key={index} start={node.attrs?.start}>{children}</ol>
    case 'listItem': return <li key={index}>{children}</li>
    case 'blockquote': return <blockquote key={index}>{children}</blockquote>
    case 'paragraph': return <p key={index} style={style}>{children}</p>
    default: return <span key={index}>{children}</span>
  }
}

interface Props {
  content?: StudioRichTextNode
  fallbackText?: string
}

export default function RichTextContent({ content, fallbackText = '' }: Props) {
  const document = content ?? {
    type: 'doc' as const,
    content: fallbackText.split(/\n{2,}/).map((paragraph) => ({
      type: 'paragraph' as const,
      content: paragraph.split('\n').flatMap((line, index) => [
        ...(index ? [{ type: 'hardBreak' as const }] : []),
        ...(line ? [{ type: 'text' as const, text: line }] : []),
      ]),
    })),
  }
  return <div className="studio-rich-content">{(document.content ?? []).map((node, index) => renderNode(node, index))}</div>
}
