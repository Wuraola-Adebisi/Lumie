import { describe, expect, it } from 'vitest'
import { migrateStudioDocument, plainTextToRichText } from './studioTypes'

describe('studio document schema migration', () => {
  it('upgrades a v1 draft and preserves paragraph and line-break structure', () => {
    const migrated = migrateStudioDocument({
      id: 'draft-1',
      name: 'Old letter',
      format: 'letter',
      background: '#fffdf7',
      updatedAt: '2026-01-01T00:00:00.000Z',
      elements: [{ id: 'text-1', kind: 'text', x: 10, y: 12, width: 80, text: 'Dear you,\n\nA note\nwith a break.' }],
    })

    expect(migrated?.schemaVersion).toBe(2)
    expect(migrated?.elements[0].richText).toEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Dear you,' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'A note' }, { type: 'hardBreak' }, { type: 'text', text: 'with a break.' }] },
      ],
    })
  })

  it('preserves legacy bold, italic and paragraph alignment', () => {
    const migrated = migrateStudioDocument({
      id: 'draft-2',
      elements: [{ id: 'text-2', kind: 'text', x: 0, y: 0, width: 80, text: 'Keep this style', bold: true, italic: true, textAlign: 'center' }],
    })
    const paragraph = migrated?.elements[0].richText?.content?.[0]

    expect(paragraph?.attrs?.textAlign).toBe('center')
    expect(paragraph?.content?.[0].marks).toEqual([{ type: 'bold' }, { type: 'italic' }])
  })

  it('does not overwrite rich text that is already present', () => {
    const richText = plainTextToRichText('Already structured')
    const migrated = migrateStudioDocument({
      id: 'draft-3',
      elements: [{ id: 'text-3', kind: 'text', x: 0, y: 0, width: 80, text: 'Legacy value', richText }],
    })

    expect(migrated?.elements[0].richText).toEqual(richText)
  })

  it('rejects invalid draft payloads', () => {
    expect(migrateStudioDocument(null)).toBeNull()
    expect(migrateStudioDocument({ elements: [] })).toBeNull()
    expect(migrateStudioDocument({ id: 'missing-elements' })).toBeNull()
  })
})
