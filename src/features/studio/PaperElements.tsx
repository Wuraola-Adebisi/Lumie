import Stamp from '../../components/mail/Stamp'
import type { StampArt, StampTone } from '../../components/mail/Stamp'
import Sticker from '../../components/mail/Sticker'
import RichTextContent from './RichTextContent'
import type { StudioElement } from './studioTypes'

/** The visual content of one layer. Shared by the editable canvas and the share image. */
export function ElementBody({ element }: { element: StudioElement }) {
  switch (element.kind) {
    case 'text':
      return (
        <div style={{ fontFamily: element.fontFamily, fontSize: `clamp(10px, ${element.fontSize ?? 16}px, 42px)`, color: element.color ?? '#14193f', overflowWrap: 'anywhere' }}>
          <RichTextContent content={element.richText} fallbackText={element.text} />
        </div>
      )
    case 'stamp':
      return <Stamp tone={(element.tone as StampTone) ?? 'saffron'} art={(element.art as StampArt) ?? 'sun'} lines={(element.value ?? 'POST').split('\n')} label="Stamp" />
    case 'decoration':
      return <div className="studio-decoration-art"><Sticker kind={element.value} color={element.color ?? '#ee4a2f'} size={(element.fontSize ?? 34) * 1.6} /></div>
    case 'photo':
      return element.image ? <img src={element.image} alt="Uploaded composition layer" draggable={false} /> : null
    default:
      return null
  }
}
