import { ImagePlus, Plus, Stamp, Type, Trash2 } from 'lucide-react'
import type { ChangeEvent } from 'react'
import type { StudioDocument, StudioElement } from './studioTypes'
import { fontOptions, paperOptions } from './studioTypes'

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
    if (!file.type.startsWith('image/')) return
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

  return (
    <aside className="studio-inspector">
      <div className="studio-panel-heading"><span>THE LITTLE DETAILS</span><span>✳</span></div>
      <section className="studio-inspector-section">
        <h3>Start with a layer</h3>
        <div className="studio-add-grid">
          <button onClick={onAddText}><Type/><span>Text</span></button>
          <button onClick={onAddStamp}><Stamp/><span>Stamp</span></button>
          <button onClick={onAddDecoration}><Plus/><span>Decor</span></button>
          <label className="studio-add-upload"><ImagePlus/><span>Photo<input type="file" accept="image/*" onChange={uploadPhoto}/></span></label>
        </div>
      </section>
      <section className="studio-inspector-section">
        <h3>Paper colour</h3>
        <div className="studio-paper-swatches">
          {paperOptions.map((paper) => <button key={paper.name} title={paper.name} aria-label={paper.name} className={document.background === paper.value ? 'active' : ''} style={{ background: paper.value }} onClick={() => onBackground(paper.value)} />)}
        </div>
      </section>
      {selected ? (
        <section className="studio-inspector-section studio-selected-panel">
          <div className="studio-selected-heading"><h3>Selected layer</h3><button className="studio-delete-button" onClick={onDelete} aria-label="Delete selected layer"><Trash2 size={15}/></button></div>
          {selected.kind === 'text' && <>
            <label className="studio-field-label">Your words</label>
            <textarea className="studio-field studio-text-field" value={selected.text ?? ''} onChange={(event) => onChange({ text: event.target.value })} rows={5}/>
            <label className="studio-field-label">Typeface</label>
            <select className="studio-field" value={selected.fontFamily ?? fontOptions[0].value} onChange={(event) => onChange({ fontFamily: event.target.value })}>{fontOptions.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}</select>
            <label className="studio-field-label">Text size · {selected.fontSize ?? 16}px</label>
            <input className="studio-range" type="range" min="11" max="42" value={selected.fontSize ?? 16} onChange={(event) => onChange({ fontSize: Number(event.target.value) })}/>
            <label className="studio-field-label">Ink colour</label>
            <div className="studio-ink-options">{['#1d2a45','#f05f4c','#4968f5','#658b75','#7b5bb5','#ffffff'].map((color) => <button key={color} className={selected.color === color ? 'active' : ''} style={{ background: color }} onClick={() => onChange({ color })} aria-label={`Set text colour ${color}`}/>)}</div>
          </>}
          {selected.kind === 'stamp' && <>
            <label className="studio-field-label">Stamp lettering</label>
            <input className="studio-field" value={selected.value ?? ''} onChange={(event) => onChange({ value: event.target.value })} maxLength={18}/>
          </>}
          {selected.kind === 'decoration' && <>
            <label className="studio-field-label">Decoration</label>
            <div className="studio-decor-options">{['✳','♥','✿','✦','☀','✉'].map((value) => <button key={value} className={selected.value === value ? 'active' : ''} onClick={() => onChange({ value })}>{value}</button>)}</div>
            <label className="studio-field-label">Size · {selected.fontSize ?? 34}px</label>
            <input className="studio-range" type="range" min="16" max="64" value={selected.fontSize ?? 34} onChange={(event) => onChange({ fontSize: Number(event.target.value) })}/>
          </>}
          {selected.kind === 'photo' && <p className="studio-helper-copy">Your photo is part of this composition. Drag it on the paper to reposition it.</p>}
          <label className="studio-field-label">Rotation · {selected.rotation ?? 0}°</label>
          <input className="studio-range" type="range" min="-20" max="20" value={selected.rotation ?? 0} onChange={(event) => onChange({ rotation: Number(event.target.value) })}/>
          <label className="studio-field-label">Layer width · {selected.width}%</label>
          <input className="studio-range" type="range" min="8" max="92" value={selected.width} onChange={(event) => onChange({ width: Number(event.target.value) })}/>
        </section>
      ) : <div className="studio-inspector-empty"><span>↖</span><strong>Pick something on the paper</strong><p>Choose a layer to edit its words, colour, size and position.</p></div>}
      <div className="studio-inspector-footnote">Your work is saved in this browser on this device. It is not sent anywhere.</div>
    </aside>
  )
}
