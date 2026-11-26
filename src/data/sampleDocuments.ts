import { GRID_PAPER, plainTextToRichText } from '../features/studio/studioTypes'
import type { StudioDocument, StudioElement } from '../features/studio/studioTypes'

const bold = (text: string) => ({ type: 'doc' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text, marks: [{ type: 'bold' as const }] }] }] })

function text(id: string, x: number, y: number, width: number, value: string, fontFamily: string, fontSize: number, color: string, opts: Partial<StudioElement> = {}): StudioElement {
  return { id, kind: 'text', x, y, width, text: value, richText: opts.richText ?? plainTextToRichText(value), fontFamily, fontSize, color, ...opts }
}

export const sampleLetter: StudioDocument = {
  schemaVersion: 2, id: 'sample-letter', name: 'Letter', format: 'letter', background: '#dcf28b', updatedAt: '2026-11-25T00:00:00.000Z',
  elements: [
    text('l1', 9, 10, 74, 'Dear Mara,', "'MuseoModerno', sans-serif", 33, '#121c5a', { richText: bold('Dear Mara,'), rotation: -1 }),
    text('l2', 10, 26, 78, 'The cherry tree outside the flat is finally in flower.\n\nI thought of you on the walk home and wanted to write it down properly instead of sending a text.\n\nCome in April if you can. There is a spare room and a kettle.', "'Courier Prime', monospace", 14.5, '#1c2a14'),
    text('l3', 10, 78, 50, 'See you soon,\nJo', "'Caveat', cursive", 27, '#1d3a9c', { rotation: -2 }),
    { id: 'l4', kind: 'stamp', x: 77, y: 6, width: 15, value: 'POST', tone: 'tomato', art: 'flower' },
    { id: 'l5', kind: 'decoration', x: 74, y: 76, width: 14, value: 'heart', color: '#ee4a2f', fontSize: 40 },
  ],
}

export const samplePostcard: StudioDocument = {
  schemaVersion: 2, id: 'sample-postcard', name: 'Postcard', format: 'postcard', background: GRID_PAPER, updatedAt: '2026-11-25T00:00:00.000Z',
  elements: [
    text('p1', 6, 10, 62, 'Greetings from the harbour', "'MuseoModerno', sans-serif", 30, '#1f4fd6', { richText: bold('Greetings from the harbour'), rotation: -2 }),
    text('p2', 7, 46, 58, 'The boats are red, the water is loud and the bakery opens at six. Wish you were here.', "'Caveat', cursive", 24, '#121c5a'),
    { id: 'p3', kind: 'stamp', x: 76, y: 8, width: 17, value: 'POST', tone: 'cobalt', art: 'fish' },
    { id: 'p4', kind: 'decoration', x: 74, y: 62, width: 16, value: 'sun', color: '#f2b632', fontSize: 40 },
  ],
}
