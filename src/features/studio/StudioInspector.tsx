import { ImagePlus, Plus, Stamp, Type, Trash2 } from 'lucide-react'
import type { ChangeEvent } from 'react'
import type { StudioDocument, StudioElement, StudioRichTextNode } from './studioTypes'
import { fontOptions, inkOptions, paperOptions, paperStyle } from './studioTypes'
import Sticker, { stickerKinds, stickerLabels } from '../../components/mail/Sticker'
import { normalizeSticker } from '../../components/mail/Sticker'
import { stampArts, stampTones } from '../../components/mail/Stamp'
import RichTextEditor from './RichTextEditor'
import StudioAssistant from './StudioAssistant'

interface Props {
  document: StudioDocument
  selected: StudioElement | null
  onChange: (patch: Partial<StudioElement>) => void
  onBackground: (value: string) => void
  onAddText: () => void
  onAddStamp: () => void
  onAddDecoration: () => void
  onAddPhoto: (file: File) => void
  onPhotoError: (message: string) => void
  onDelete: () => void
}

export default function StudioInspector({ document, selected, onChange, onBackground, onAddText, onAddStamp, onAddDecoration, onAddPhoto, onPhotoError, onDelete }: Props) {
  const uploadPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      onPhotoError('Choose an image file to add it to your composition.')
      input.value = ''
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      onPhotoError('Choose a JPEG, PNG, WebP or AVIF image.')
      input.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      onPhotoError('Choose an image no larger than 10 MB.')
      input.value = ''
      return
    }

    onAddPhoto(file)
    input.value = ''
  }

  const updateRichText = (richText: StudioRichTextNode) => onChange({ richText })

  return (
    <aside className="studio-inspector" aria-label="Composition controls">
      <div className="studio-panel-heading">Your materials</div>
      <section className="studio-inspector-section" aria-labelledby="studio-add-heading">
        <h3 id="studio-add-heading">Add something</h3>
        <div className="studio-add-grid">
          <button type="button" onClick={onAddText}><Type aria-hidden="true"/><span>Text</span></button>
          <button type="button" onClick={onAddStamp}><Stamp aria-hidden="true"/><span>Stamp</span></button>
          <button type="button" onClick={onAddDecoration}><Plus aria-hidden="true"/><span>Sticker</span></button>
          <input id="studio-photo-upload" className="studio-visually-hidden" type="file" accept="image/*" aria-label="Choose a photo" onChange={uploadPhoto} />
          <label className="studio-add-upload" htmlFor="studio-photo-upload" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); window.document.getElementById('studio-photo-upload')?.click() } }}><ImagePlus aria-hidden="true"/><span>Photo</span></label>
        </div>
        <p className="studio-upload-hint" id="studio-photo-hint">JPEG, PNG, WebP or AVIF, up to 10 MB.</p>
      </section>
      <section className="studio-inspector-section" aria-labelledby="studio-paper-heading">
        <h3 id="studio-paper-heading">Paper</h3>
        <div className="studio-paper-swatches">
          {paperOptions.map((paper) => (
            <button type="button" key={paper.name} title={paper.name} aria-label={paper.name} aria-pressed={document.background === paper.value} className={document.background === paper.value ? 'active' : ''} style={paperStyle(paper.value)} onClick={() => onBackground(paper.value)} />
          ))}
        </div>
      </section>
      {selected ? (
        <section className="studio-inspector-section studio-selected-panel" aria-labelledby="studio-selected-heading">
          <div className="studio-selected-heading"><h3 id="studio-selected-heading">Selected layer</h3><button type="button" className="studio-delete-button" onClick={onDelete} aria-label="Delete selected layer"><Trash2 size={15}/></button></div>
          {selected.kind === 'text' && <>
            <span className="studio-field-label" style={{ display: 'block' }}>Your words</span>
            <RichTextEditor key={selected.id} elementId={selected.id} value={selected.richText} legacyText={selected.text} onChange={updateRichText}/>
            <label className="studio-field-label" htmlFor="studio-layer-font">Typeface</label>
            <select id="studio-layer-font" className="studio-field" value={selected.fontFamily ?? fontOptions[0].value} onChange={(event) => onChange({ fontFamily: event.target.value })}>{fontOptions.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}</select>
            <label className="studio-field-label" htmlFor="studio-layer-size">Base text size: {selected.fontSize ?? 16}px</label>
            <input id="studio-layer-size" className="studio-range" type="range" min="11" max="42" value={selected.fontSize ?? 16} onChange={(event) => onChange({ fontSize: Number(event.target.value) })}/>
            <span className="studio-field-label" style={{ display: 'block' }}>Ink colour</span>
            <div className="studio-ink-options">{inkOptions.map((color) => <button type="button" key={color} className={selected.color === color ? 'active' : ''} style={{ background: color }} onClick={() => onChange({ color })} aria-label={`Set text colour ${color}`} aria-pressed={selected.color === color}/>)}</div>
          </>}
          {selected.kind === 'stamp' && <>
            <label className="studio-field-label" htmlFor="studio-stamp-text">Stamp lettering</label>
            <input id="studio-stamp-text" className="studio-field" value={selected.value ?? ''} onChange={(event) => onChange({ value: event.target.value })} maxLength={18}/>
            <span className="studio-field-label" style={{ display: 'block' }}>Stamp colour</span>
            <div className="studio-ink-options">{stampTones.map((tone) => <button type="button" key={tone.id} className={(selected.tone ?? 'saffron') === tone.id ? 'active' : ''} style={{ background: tone.bg }} onClick={() => onChange({ tone: tone.id })} aria-label={`Stamp colour ${tone.label}`} aria-pressed={(selected.tone ?? 'saffron') === tone.id}/>)}</div>
            <span className="studio-field-label" style={{ display: 'block' }}>Stamp picture</span>
            <div className="studio-art-options">{stampArts.map((art) => <button type="button" key={art.id} className={(selected.art ?? 'sun') === art.id ? 'active' : ''} onClick={() => onChange({ art: art.id })} aria-pressed={(selected.art ?? 'sun') === art.id}>{art.label}</button>)}</div>
          </>}
          {selected.kind === 'decoration' && <>
            <span className="studio-field-label" style={{ display: 'block' }}>Sticker</span>
            <div className="studio-decor-options">{stickerKinds.map((kind) => <button type="button" key={kind} className={normalizeSticker(selected.value) === kind ? 'active' : ''} aria-label={stickerLabels[kind]} aria-pressed={normalizeSticker(selected.value) === kind} onClick={() => onChange({ value: kind })}><Sticker kind={kind} color={selected.color ?? '#ee4a2f'} size={30}/></button>)}</div>
            <span className="studio-field-label" style={{ display: 'block' }}>Sticker colour</span>
            <div className="studio-ink-options">{inkOptions.filter((color) => color !== '#ffffff').map((color) => <button type="button" key={color} className={selected.color === color ? 'active' : ''} style={{ background: color }} onClick={() => onChange({ color })} aria-label={`Sticker colour ${color}`} aria-pressed={selected.color === color}/>)}</div>
            <label className="studio-field-label" htmlFor="studio-decoration-size">Size: {selected.fontSize ?? 34}px</label>
            <input id="studio-decoration-size" className="studio-range" type="range" min="16" max="64" value={selected.fontSize ?? 34} onChange={(event) => onChange({ fontSize: Number(event.target.value) })}/>
          </>}
          {selected.kind === 'photo' && <p className="studio-helper-copy">Drag the photo on the paper to move it.</p>}
          <label className="studio-field-label" htmlFor="studio-layer-rotation">Rotation: {selected.rotation ?? 0}°</label>
          <input id="studio-layer-rotation" className="studio-range" type="range" min="-20" max="20" value={selected.rotation ?? 0} onChange={(event) => onChange({ rotation: Number(event.target.value) })}/>
          <label className="studio-field-label" htmlFor="studio-layer-width">Layer width: {selected.width}%</label>
          <input id="studio-layer-width" className="studio-range" type="range" min="8" max="92" value={selected.width} onChange={(event) => onChange({ width: Number(event.target.value) })}/>
        </section>
      ) : <div className="studio-inspector-empty"><strong>Select a layer on the paper</strong><p>Its words, colour, size and position appear here.</p></div>}
      <StudioAssistant />
    </aside>
  )
}
