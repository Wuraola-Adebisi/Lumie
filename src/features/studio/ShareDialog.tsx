import { Download, X } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useEffect, useRef, useState } from 'react'
import ShareScene, { backdrops, shareSizes } from './ShareScene'
import type { Backdrop, ShareSize } from './ShareScene'
import type { StudioDocument } from './studioTypes'

interface Props { document: StudioDocument; onClose: () => void; onToast: (message: string) => void }

export default function ShareDialog({ document: doc, onClose, onToast }: Props) {
  const [backdrop, setBackdrop] = useState<Backdrop>('gingham')
  const [size, setSize] = useState<ShareSize>('post')
  const [busy, setBusy] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const { w, h, out } = shareSizes[size]
  const scale = Math.min(380 / w, 520 / h)

  useEffect(() => {
    const opener = window.document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); opener?.focus?.() }
  }, [onClose])

  const download = async () => {
    const node = nodeRef.current
    if (!node || busy) return
    setBusy(true)
    try {
      await window.document.fonts.ready
      await Promise.all(Array.from(node.querySelectorAll('img')).map((image) => image.decode().catch(() => undefined)))
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, width: w, height: h })
      const link = window.document.createElement('a')
      link.download = `lumie-share-${doc.format}-${size}-${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      link.click()
      onToast(`Saved a ${out} image.`)
    } catch {
      onToast('The image could not be created. Try again, or remove a large photo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="share-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <div className="share-preview graph"><ShareScene document={doc} backdrop={backdrop} size={size} scale={scale} nodeRef={nodeRef} /></div>
        <div className="share-controls">
          <div className="flex items-start justify-between gap-3">
            <h2 id="share-title">Make a share image</h2>
            <button ref={closeRef} type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
          <p className="m-0 text-[14px] leading-relaxed text-muted">Create a downloadable picture of your design, styled with an envelope, stamp and seal. This does not send the letter or deliver it to a recipient.</p>
          <fieldset>
            <legend>Backdrop</legend>
            <div className="share-choices">
              {backdrops.map((item) => (
                <label className="share-choice" key={item.id}>
                  <input type="radio" name="backdrop" checked={backdrop === item.id} onChange={() => setBackdrop(item.id)} />
                  <span><i className="share-swatch" style={{ background: item.swatch }} />{item.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Size</legend>
            <div className="share-choices">
              {(Object.keys(shareSizes) as ShareSize[]).map((id) => (
                <label className="share-choice" key={id}>
                  <input type="radio" name="size" checked={size === id} onChange={() => setSize(id)} />
                  <span><span>{shareSizes[id].label}<small className="share-size-note">{shareSizes[id].out}</small></span></span>
                </label>
              ))}
            </div>
          </fieldset>
          <button type="button" className="btn btn-primary mt-auto" onClick={download} disabled={busy}><Download size={17} /> {busy ? 'Making the image' : 'Download image'}</button>
        </div>
      </div>
    </div>
  )
}
