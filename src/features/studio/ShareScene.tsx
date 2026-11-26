import type { Ref } from 'react'
import Envelope from '../../components/mail/Envelope'
import type { EnvelopeTone } from '../../components/mail/Envelope'
import HoloSeal from '../../components/mail/HoloSeal'
import Postmark from '../../components/mail/Postmark'
import Stamp from '../../components/mail/Stamp'
import { ElementBody } from './PaperElements'
import { formatAspect, paperStyle } from './studioTypes'
import type { StudioDocument } from './studioTypes'

export type Backdrop = 'gingham' | 'cobalt' | 'graph' | 'tomato'
export type ShareSize = 'post' | 'story' | 'square'

export const backdrops: { id: Backdrop; label: string; swatch: string; envelope: EnvelopeTone; ink: string }[] = [
  { id: 'gingham', label: 'Gingham', swatch: '#f4a6c1', envelope: 'gold', ink: '#121c5a' },
  { id: 'cobalt', label: 'Cobalt', swatch: '#1f4fd6', envelope: 'tomato', ink: '#fff8e8' },
  { id: 'graph', label: 'Graph paper', swatch: '#fbf2dd', envelope: 'cobalt', ink: '#121c5a' },
  { id: 'tomato', label: 'Tomato', swatch: '#ee4a2f', envelope: 'gold', ink: '#121c5a' },
]
export const shareSizes: Record<ShareSize, { w: number; h: number; label: string; out: string }> = {
  post: { w: 540, h: 675, label: 'Post', out: '1080 × 1350' },
  story: { w: 540, h: 960, label: 'Story', out: '1080 × 1920' },
  square: { w: 540, h: 540, label: 'Square', out: '1080 × 1080' },
}

const NATURAL_WIDTH = 570

interface Props { document: StudioDocument; backdrop: Backdrop; size: ShareSize; scale?: number; nodeRef?: Ref<HTMLDivElement> }

/**
 * The piece laid on a desk with an envelope, a stamp and a seal.
 * The node under nodeRef is the unscaled artwork that gets exported.
 */
export default function ShareScene({ document, backdrop, size, scale = 1, nodeRef }: Props) {
  const { w: W, h: H } = shareSizes[size]
  const look = backdrops.find((item) => item.id === backdrop) ?? backdrops[0]
  const aspect = formatAspect(document.format)
  const naturalHeight = NATURAL_WIDTH / aspect
  const k = Math.min((W * 0.74) / NATURAL_WIDTH, (H * (size === 'story' ? 0.56 : 0.64)) / naturalHeight)
  const pw = NATURAL_WIDTH * k
  const ph = naturalHeight * k
  const cy = H * 0.48
  const stampW = W * 0.17
  const stampLeft = W / 2 + pw / 2 - stampW * 0.62
  const stampTop = cy - ph / 2 - stampW * 1.26 * 0.38
  const sealW = W * 0.19
  const markW = W * 0.34

  return (
    <div style={{ width: W * scale, height: H * scale, overflow: 'hidden', borderRadius: scale < 1 ? 10 : 0 }}>
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div ref={nodeRef} className={`share share-${backdrop}`} style={{ width: W, height: H }}>
          <div className="share-env" style={{ left: -W * 0.08, bottom: H * (size === 'story' ? 0.07 : 0.015), width: W * 0.62 }}><Envelope tone={look.envelope} open /></div>
          <div className="share-stage" style={{ top: cy, width: pw, height: ph }}>
            <div className="share-paper-box" style={{ width: pw, height: ph }}>
              <div className="share-paper" style={{ width: NATURAL_WIDTH, height: naturalHeight, transform: `scale(${k})`, ...paperStyle(document.background) }}>
                <div className="studio-paper-grain" />
                {document.elements.map((element) => (
                  <div key={element.id} className={`paper-el paper-el-${element.kind}`} style={{ left: `${element.x}%`, top: `${element.y}%`, width: `${element.width}%`, transform: `rotate(${element.rotation ?? 0}deg)`, color: element.color ?? undefined }}>
                    <ElementBody element={element} />
                  </div>
                ))}
                <div className="studio-paper-footer"><span>lumie</span><span>mail club</span></div>
              </div>
              <div className="share-sheen" style={{ position: 'absolute' }} />
            </div>
          </div>
          <Postmark className="share-mark" style={{ left: stampLeft - markW * 0.66, top: stampTop + W * 0.015, width: markW }} line1={new Date().toLocaleDateString('en', { month: 'short', day: 'numeric' }).toUpperCase()} line2={String(new Date().getFullYear())} />
          <div className="share-stamp" style={{ left: stampLeft, top: stampTop, width: stampW }}><Stamp tone="saffron" art="sun" lines={['LUMIE']} label="" /></div>
          <HoloSeal className="share-seal" style={{ left: W / 2 + pw / 2 - sealW * 0.6, top: cy + ph / 2 - sealW * 0.62, width: sealW }} />
          <span className="tape share-tape" style={{ left: W / 2 - pw / 2 - W * 0.05, top: cy - ph / 2 - 6, width: W * 0.14, height: 26 }} />
          <div className="share-brand" style={{ bottom: H * 0.035, color: look.ink }}>lumie</div>
        </div>
      </div>
    </div>
  )
}
