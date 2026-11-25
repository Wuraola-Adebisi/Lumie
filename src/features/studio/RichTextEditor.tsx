import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { AlignCenter, AlignLeft, AlignRight, Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Strikethrough, Code } from 'lucide-react'
import type { StudioRichTextNode } from './studioTypes'
import { plainTextToRichText } from './studioTypes'

interface Props {
  elementId: string
  value?: StudioRichTextNode
  legacyText?: string
  onChange: (value: StudioRichTextNode) => void
}

export default function RichTextEditor({ elementId, value, legacyText = '', onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value ?? plainTextToRichText(legacyText),
    editorProps: {
      attributes: {
        class: 'studio-rich-editor-content',
        'aria-label': 'Rich text content',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getJSON() as StudioRichTextNode),
  }, [elementId])

  useEffect(() => {
    if (!editor) return
    const next = value ?? plainTextToRichText(legacyText)
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(next)) {
      editor.commands.setContent(next, false)
    }
  }, [editor, elementId, value, legacyText])

  if (!editor) return <div className="studio-rich-editor-loading" aria-live="polite">Loading writing tools…</div>

  const applyLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const current = editor.getAttributes('link').href as string | undefined
    const href = window.prompt('Paste a web address', current ?? 'https://')
    if (href === null) return
    const trimmed = href.trim()
    if (!/^https?:\/\//i.test(trimmed)) {
      window.alert('Use a complete web address beginning with https:// or http://.')
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed, target: '_blank', rel: 'noopener noreferrer' }).run()
  }

  const controls = [
    { label: 'Bold', active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run(), icon: <Bold size={15}/> },
    { label: 'Italic', active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run(), icon: <Italic size={15}/> },
    { label: 'Strikethrough', active: editor.isActive('strike'), run: () => editor.chain().focus().toggleStrike().run(), icon: <Strikethrough size={15}/> },
    { label: 'Inline code', active: editor.isActive('code'), run: () => editor.chain().focus().toggleCode().run(), icon: <Code size={15}/> },
    { label: 'Heading 2', active: editor.isActive('heading', { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), icon: <Heading2 size={15}/> },
    { label: 'Heading 3', active: editor.isActive('heading', { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), icon: <Heading3 size={15}/> },
    { label: 'Bulleted list', active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run(), icon: <List size={15}/> },
    { label: 'Numbered list', active: editor.isActive('orderedList'), run: () => editor.chain().focus().toggleOrderedList().run(), icon: <ListOrdered size={15}/> },
    { label: 'Block quote', active: editor.isActive('blockquote'), run: () => editor.chain().focus().toggleBlockquote().run(), icon: <Quote size={15}/> },
    { label: 'Add or remove link', active: editor.isActive('link'), run: applyLink, icon: <Link2 size={15}/> },
  ]

  return (
    <div className="studio-rich-editor">
      <div className="studio-rich-toolbar" role="toolbar" aria-label="Text formatting">
        {controls.map((control) => (
          <button key={control.label} type="button" title={control.label} aria-label={control.label} aria-pressed={control.active} className={control.active ? 'active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={control.run}>
            {control.icon}
          </button>
        ))}
        <span className="studio-toolbar-divider" />
        <button type="button" title="Align left" aria-label="Align left" aria-pressed={editor.isActive({ textAlign: 'left' })} className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={15}/></button>
        <button type="button" title="Align centre" aria-label="Align centre" aria-pressed={editor.isActive({ textAlign: 'center' })} className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={15}/></button>
        <button type="button" title="Align right" aria-label="Align right" aria-pressed={editor.isActive({ textAlign: 'right' })} className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={15}/></button>
      </div>
      <EditorContent editor={editor} />
      <p className="studio-rich-editor-help">Select words to format them. Press Enter for a new paragraph.</p>
    </div>
  )
}
