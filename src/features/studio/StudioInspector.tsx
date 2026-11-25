import { ImagePlus, Plus, Stamp, Type, Trash2 } from 'lucide-react'
import type { ChangeEvent } from 'react'
import type { StudioDocument, StudioElement, StudioRichTextNode } from './studioTypes'
import { fontOptions, paperOptions } from './studioTypes'
import RichTextEditor from './RichTextEditor'

interface Props {
  document: StudioDocument
  selected: StudioElement | null
  onChange: (patch: Partial<StudioElement>) => void
  onBackground: (value: string) => void
  onAddText: () => void
  onAddStamp: () => void
  onAddDecoration: () => void
  onAddPhoto: (dataUrl: string) => void
  onDelete: () => void
}

export default function StudioInspector({ document, selected, onChange, onBackground, onAddText, onAddStamp, onAddDecoration, onAddPhoto, onDelete }: Props) {
  const uploadPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      window.alert('Choose an image file to add it to your composition.')
      event.target.value = ''
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      window.alert('Choose an image smaller than 3 MB for this local editor.')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onAddPhoto(reader.result)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const updateRichText = (richText: StudioRichTextNode) => onChange({ richText })

  return (
    <aside className="studio-inspector" aria-label="Composition controls">
      <div className="studio-panel-heading"><span>THE LITTLE DETAILS</span><span aria-hidden="true">✳</span></div>
      <section className="studio-inspector-section" aria-labelledby="studio-add-heading">
        <h3 id="studio-add-heading">Start with a layer</h3>
        <div className="studio-add-grid">
          <button type="button" onClick={onAddText}><Type aria-hidden="true"/><span>Text</span></button>
          <button type="button" onClick={onAddStamp}><Stamp aria-hidden="true"/><span>Stamp</span></button>
          <button type="button" onClick={onAddDecoration}><Plus aria-hidden="true"/><span>Decor</span></button>
          <input id="studio-photo-upload" className="studio-visually-hidden" type="file" accept="image/*" onChange={uploadPhoto} />
          <label className="studio-add-upload" htmlFor="studio-photo-upload"><ImagePlus aria-hidden="true"/><span>Photo</span></label>
        </div>
      </section>
      <section className="studio-inspector-section" aria-labelledby="studio-paper-heading">
        <h3 id="studio-paper-heading">Paper colour</h3>
        <div className="studio-paper-swatches">
          {paperOptions.map((paper) => (
            <button type="button" key={paper.name} title={paper.name} aria-label={paper.name} aria-pressed={document.background === paper.value} className={document.background === paper.value ? 'active' : ''} style={{ background: paper.value }} onClick={() => onBackground(paper.value)} />
          ))}
        </div>
      </section>
      {selected ? (
        <section className="studio-inspector-section studio-selected-panel" aria-labelledby="studio-selected-heading">
          <div className="studio-selected-heading"><h3 id="studio-selected-heading">Selected layer</h3><button type="button" className="studio-delete-button" onClick={onDelete} aria-label="Delete selected layer"><Trash2 size={15}/></button></div>
          {selected.kind === 'text' && <>
            <label className="studio-field-label">Your words</label>
            <RichTextEditor key={selected.id} elementId={selected.id} value={selected.richText} legacyText={selected.text} onChange={updateRichText}/>
            <label className="studio-field-label" htmlFor="studio-layer-font">Typeface</label>
            <select id="studio-layer-font" className="studio-field" value={selected.fontFamily ?? fontOptions[0].value} onChange={(event) => onChange({ fontFamily: event.target.value })}>{fontOptions.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}</select>
            <label className="studio-field-label" htmlFor="studio-layer-size">Base text size · {selected.fontSize ?? 16}px</label>
            <input id="studio-layer-size" className="studio-range" type="range" min="11" max="42" value={selected.fontSize ?? 16} onChange={(event) => onChange({ fontSize: Number(event.target.value) })}/>
            <label className="studio-field-label">Ink colour</label>
            <div className="studio-ink-options">{['#1d2a45','#f05f4c','#4968f5','#658b75','#7b5bb5','#ffffff'].map((color) => <button type="button" key={color} className={selected.color === color ? 'active' : ''} style={{ background: color }} onClick={() => onChange({ color })} aria-label={`Set text colour ${color}`} aria-pressed={selected.color === color}/>)}</div>
          </>}
          {selected.kind === 'stamp' && <>
            <label className="studio-field-label" htmlFor="studio-stamp-text">Stamp lettering</label>
            <input id="studio-stamp-text" className="studio-field" value={selected.value ?? ''} onChange={(event) => onChange({ value: event.target.value })} maxLength={18}/>
          </>}
          {selected.kind === 'decoration' && <>
            <label className="studio-field-label">Decoration</label>
            <div className="studio-decor-options">{['✳','♥','✿','✦','☀','✉'].map((value) => <button type="button" key={value} className={selected.value === value ? 'active' : ''} aria-pressed={selected.value === value} onClick={() => onChange({ value })}>{value}</button>)}</div>
            <label className="studio-field-label" htmlFor="studio-decoration-size">Size · {selected.fontSize ?? 34}px</label>
            <input id="studio-decoration-size" className="studio-range" type="range" min="16" max="64" value={selected.fontSize ?? 34} onChange={(event) => onChange({ fontSize: Number(event.target.value) })}/>
          </>}
          {selected.kind === 'photo' && <p className="studio-helper-copy">Your photo is part of this composition. Drag it on the paper to reposition it.</p>}
          <label className="studio-field-label" htmlFor="studio-layer-rotation">Rotation · {selected.rotation ?? 0}°</label>
          <input id="studio-layer-rotation" className="studio-range" type="range" min="-20" max="20" value={selected.rotation ?? 0} onChange={(event) => onChange({ rotation: Number(event.target.value) })}/>
          <label className="studio-field-label" htmlFor="studio-layer-width">Layer width · {selected.width}%</label>
          <input id="studio-layer-width" className="studio-range" type="range" min="8" max="92" value={selected.width} onChange={(event) => onChange({ width: Number(event.target.value) })}/>
        </section>
      ) : <div className="studio-inspector-empty"><span aria-hidden="true">↖</span><strong>Pick something on the paper</strong><p>Choose a layer to edit its words, colour, size and position.</p></div>}
      <div className="studio-inspector-footnote">Your work is saved in this browser on this device. It is not sent anywhere.</div>
    </aside>
  )
}
