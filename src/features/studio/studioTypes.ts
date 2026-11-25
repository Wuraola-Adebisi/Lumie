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
  value?: string
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

export const paperOptions = [
  { name: 'Warm white', value: '#fffdf7' },
  { name: 'Butter', value: '#ffdf78' },
  { name: 'Lilac', value: '#d8ccff' },
  { name: 'Mint', value: '#a9e5c9' },
  { name: 'Coral', value: '#ffb7a9' },
  { name: 'Sky', value: '#b9d8ff' },
  { name: 'Cobalt', value: '#4968f5' },
]

export const fontOptions = [
  { label: 'DM Serif Display', value: "'DM Serif Display', serif" },
  { label: 'MuseoModerno', value: "'MuseoModerno', sans-serif" },
  { label: 'DM Sans', value: "'DM Sans', sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
]

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

/** Migrate existing local drafts in memory; callers persist the v2 result on the next autosave. */
export function migrateStudioDocument(value: unknown): StudioDocument | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<StudioDocument> & { schemaVersion?: number; elements?: StudioElement[] }
  if (!candidate.id || !Array.isArray(candidate.elements)) return null
  const elements = candidate.elements.map((element) => {
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
    schemaVersion: 2,
    name: candidate.name ?? 'A little composition',
    format: candidate.format ?? 'letter',
    background: candidate.background ?? '#fffdf7',
    elements,
    updatedAt: candidate.updatedAt ?? new Date().toISOString(),
  }
}

export function createDocument(format: StudioFormat = 'letter'): StudioDocument {
  const wide = format === 'postcard'
  const square = format === 'photo-card'
  return {
    schemaVersion: 2,
    id: createId(),
    name: format === 'letter' ? 'A little letter' : format === 'postcard' ? 'A postcard' : format === 'photo-card' ? 'A photo card' : format === 'collage' ? 'A little collage' : 'A memory page',
    format,
    background: '#fffdf7',
    updatedAt: new Date().toISOString(),
    elements: [
      { id: createId(), kind: 'text', x: 9, y: 12, width: wide ? 72 : 82, text: wide ? 'A little hello' : 'Dear you,', richText: plainTextToRichText(wide ? 'A little hello' : 'Dear you,'), fontFamily: "'DM Serif Display', serif", fontSize: square ? 28 : 32, color: '#1d2a45', rotation: -1 },
      { id: createId(), kind: 'text', x: 10, y: wide ? 39 : 30, width: 78, text: 'Some things are better when they are sent.\n\nStart with a thought, a memory, or simply a hello. Make it yours, then send it somewhere lovely.', richText: plainTextToRichText('Some things are better when they are sent.\n\nStart with a thought, a memory, or simply a hello. Make it yours, then send it somewhere lovely.'), fontFamily: "'DM Serif Display', serif", fontSize: 15, color: '#46516b' },
      { id: createId(), kind: 'stamp', x: 78, y: 8, width: 14, value: 'LOVE\nPOST' },
      { id: createId(), kind: 'decoration', x: 78, y: 80, width: 12, value: '✳', color: '#f05f4c', fontSize: 34 },
    ],
  }
}
