import type { CSSProperties } from 'react'

export type StudioFormat = 'letter' | 'postcard' | 'photo-card' | 'collage' | 'memory'

export type StudioElementKind = 'text' | 'stamp' | 'decoration' | 'photo'
export type StudioTextAlign = 'left' | 'center' | 'right'

/** JSON-compatible rich-text nodes. The shape follows the Tiptap/ProseMirror document model. */
export interface StudioRichTextMark {
  type: 'bold' | 'italic' | 'strike' | 'code' | 'link'
  attrs?: { href?: string; target?: string; rel?: string }
}

export interface StudioRichTextNode {
  type: 'doc' | 'paragraph' | 'heading' | 'bulletList' | 'orderedList' | 'listItem' | 'blockquote' | 'hardBreak' | 'text'
  attrs?: { level?: number; textAlign?: StudioTextAlign; start?: number }
  text?: string
  marks?: StudioRichTextMark[]
  content?: StudioRichTextNode[]
}

export interface StudioElement {
  id: string
  kind: StudioElementKind
  x: number
  y: number
  width: number
  /** Legacy plain text retained for backwards compatibility with v1 browser drafts. */
  text?: string
  richText?: StudioRichTextNode
  fontFamily?: string
  fontSize?: number
  color?: string
  rotation?: number
  /** Stamp lettering, or the sticker name for decorations. */
  value?: string
  /** Stamp colour and picture. */
  tone?: string
  art?: string
  image?: string
  bold?: boolean
  italic?: boolean
  textAlign?: StudioTextAlign
}

export interface StudioDocument {
  schemaVersion: 2
  id: string
  name: string
  format: StudioFormat
  background: string
  elements: StudioElement[]
  updatedAt: string
}

export const studioFormats: { id: StudioFormat; label: string; ratio: string }[] = [
  { id: 'letter', label: 'Letter', ratio: '0.76 / 1' },
  { id: 'postcard', label: 'Postcard', ratio: '1.42 / 1' },
  { id: 'photo-card', label: 'Photo card', ratio: '1 / 1' },
  { id: 'collage', label: 'Collage', ratio: '0.9 / 1' },
  { id: 'memory', label: 'Memory page', ratio: '0.82 / 1' },
]

/** Width divided by height for a format. */
export function formatAspect(format: StudioFormat): number {
  const ratio = studioFormats.find((item) => item.id === format)?.ratio ?? '0.76 / 1'
  const [w, h] = ratio.split('/').map((part) => Number(part.trim()))
  return w / h
}

export const GRID_PAPER = 'grid'

export const paperOptions = [
  { name: 'Cream', value: '#fff8e8' },
  { name: 'Graph paper', value: GRID_PAPER },
  { name: 'Lime', value: '#dcf28b' },
  { name: 'Blush', value: '#f9cbd8' },
  { name: 'Sky', value: '#bfe0f2' },
  { name: 'Saffron', value: '#f6c64d' },
  { name: 'Tomato', value: '#ee4a2f' },
  { name: 'Cobalt', value: '#1f4fd6' },
]

export function paperBase(background: string): string {
  return background === GRID_PAPER ? '#fbf2dd' : background
}

export function paperStyle(background: string): CSSProperties {
  if (background === GRID_PAPER) {
    return {
      backgroundColor: '#fbf2dd',
      backgroundImage: 'linear-gradient(rgba(91,142,214,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(91,142,214,.5) 1px, transparent 1px)',
      backgroundSize: '22px 22px',
    }
  }
  return { backgroundColor: background }
}

export const fontOptions = [
  { label: 'MuseoModerno', value: "'MuseoModerno', sans-serif" },
  { label: 'Figtree', value: "'Figtree', sans-serif" },
  { label: 'DM Serif Display', value: "'DM Serif Display', serif" },
  { label: 'Courier Prime (typewriter)', value: "'Courier Prime', monospace" },
  { label: 'Caveat (handwriting)', value: "'Caveat', cursive" },
]

export const inkOptions = ['#14193f', '#ee4a2f', '#1f4fd6', '#2f8a50', '#7b5bb5', '#ffffff']

export function createId() {
  return `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function plainTextToRichText(text: string): StudioRichTextNode {
  const paragraphs = text.split(/\n{2,}/).map((paragraph) => ({
    type: 'paragraph' as const,
    content: paragraph.split('\n').flatMap((line, index) => [
      ...(index ? [{ type: 'hardBreak' as const }] : []),
      ...(line ? [{ type: 'text' as const, text: line }] : []),
    ]),
  }))
  return { type: 'doc', content: paragraphs.length ? paragraphs : [{ type: 'paragraph' }] }
}

function boldText(text: string): StudioRichTextNode {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text, marks: [{ type: 'bold' }] }] }] }
}

/** Earlier drafts used DM Sans and Georgia. Map them to the current type set. */
function currentFont(fontFamily?: string): string | undefined {
  if (!fontFamily) return fontFamily
  if (fontFamily.includes('DM Sans')) return "'Figtree', sans-serif"
  if (fontFamily.includes('Georgia')) return "'DM Serif Display', serif"
  return fontFamily
}

/** Migrate existing local drafts in memory; callers persist the v2 result on the next autosave. */
export function migrateStudioDocument(value: unknown): StudioDocument | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<StudioDocument> & { schemaVersion?: number; elements?: StudioElement[] }
  const id = candidate.id
  const sourceElements = candidate.elements
  if (!id || !Array.isArray(sourceElements)) return null
  const elements = sourceElements.map((source) => {
    const element = source.fontFamily ? { ...source, fontFamily: currentFont(source.fontFamily) } : source
    if (element.kind !== 'text' || element.richText) return element
    const migrated = plainTextToRichText(element.text ?? '')
    const legacyMarks = [
      ...(element.bold ? [{ type: 'bold' as const }] : []),
      ...(element.italic ? [{ type: 'italic' as const }] : []),
    ]
    return {
      ...element,
      richText: {
        ...migrated,
        content: migrated.content?.map((paragraph) => ({
          ...paragraph,
          attrs: element.textAlign ? { textAlign: element.textAlign } : undefined,
          content: paragraph.content?.map((node) => node.type === 'text' && legacyMarks.length
            ? { ...node, marks: legacyMarks }
            : node),
        })),
      },
    }
  })
  return {
    ...candidate,
    id,
    schemaVersion: 2,
    name: candidate.name ?? 'Untitled piece',
    format: candidate.format ?? 'letter',
    background: candidate.background ?? '#fff8e8',
    elements,
    updatedAt: candidate.updatedAt ?? new Date().toISOString(),
  }
}

const formatNames: Record<StudioFormat, string> = { letter: 'Letter', postcard: 'Postcard', 'photo-card': 'Photo card', collage: 'Collage', memory: 'Memory page' }

export function createDocument(format: StudioFormat = 'letter'): StudioDocument {
  const wide = format === 'postcard'
  const square = format === 'photo-card'
  const body = wide ? 'Write your message here.\nChange the typeface, paper and ink from the panel on the right.' : 'Write your letter here.\n\nChange the typeface, paper and ink from the panel on the right, then add a stamp or a photo.'
  return {
    schemaVersion: 2,
    id: createId(),
    name: formatNames[format],
    format,
    background: '#fff8e8',
    updatedAt: new Date().toISOString(),
    elements: [
      { id: createId(), kind: 'text', x: 9, y: 12, width: wide ? 66 : 70, text: wide ? 'Hello from here' : 'Dear you,', richText: boldText(wide ? 'Hello from here' : 'Dear you,'), fontFamily: "'MuseoModerno', sans-serif", fontSize: square ? 28 : 33, color: '#121c5a', rotation: -1 },
      { id: createId(), kind: 'text', x: 10, y: wide ? 40 : 30, width: 76, text: body, richText: plainTextToRichText(body), fontFamily: wide ? "'Caveat', cursive" : "'Courier Prime', monospace", fontSize: wide ? 22 : 14, color: '#14193f' },
      { id: createId(), kind: 'stamp', x: 78, y: 7, width: 14, value: 'POST', tone: 'saffron', art: 'sun' },
      { id: createId(), kind: 'decoration', x: 78, y: 78, width: 12, value: 'flower', color: '#ee4a2f', fontSize: 34 },
    ],
  }
}
