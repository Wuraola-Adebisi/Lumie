import { describe, expect, it } from 'vitest'
import { createDocument } from '../studio/studioTypes'
import { parseCloudCreation, parseCloudCreationPage } from './cloudCreationContract'

function makeCreation(overrides: Record<string, unknown> = {}) {
  const document = createDocument('postcard')
  return {
    id: 'creation-123',
    title: 'A postcard',
    format: 'postcard',
    document,
    revision: 1,
    status: 'draft',
    createdAt: '2026-11-27T10:00:00.000Z',
    updatedAt: '2026-11-27T10:00:00.000Z',
    ...overrides,
  }
}

describe('cloud creation contract', () => {
  it('accepts a valid version 2 creation', () => {
    const result = parseCloudCreation(makeCreation())
    expect(result.ok).toBe(true)
  })

  it('rejects unknown formats', () => {
    const result = parseCloudCreation(makeCreation({ format: 'poster' }))
    expect(result).toMatchObject({ ok: false, reason: 'Creation format is invalid.' })
  })

  it('rejects a document whose format differs from its creation', () => {
    const result = parseCloudCreation(makeCreation({ format: 'letter' }))
    expect(result).toMatchObject({ ok: false })
  })

  it('rejects duplicate element IDs', () => {
    const document = createDocument()
    document.elements.push({ ...document.elements[0] })
    const result = parseCloudCreation(makeCreation({ format: 'letter', document }))
    expect(result).toMatchObject({ ok: false })
  })

  it('rejects malformed element geometry', () => {
    const document = createDocument()
    document.elements[0].x = Number.NaN
    const result = parseCloudCreation(makeCreation({ format: 'letter', document }))
    expect(result).toMatchObject({ ok: false })
  })

  it('rejects documents above the element limit', () => {
    const document = createDocument()
    document.elements = Array.from({ length: 101 }, (_, index) => ({
      id: `element-${index}`,
      kind: 'decoration' as const,
      x: 1,
      y: 1,
      width: 10,
    }))
    const result = parseCloudCreation(makeCreation({ format: 'letter', document }))
    expect(result).toMatchObject({ ok: false })
  })

  it('rejects an invalid revision and invalid timestamps', () => {
    expect(parseCloudCreation(makeCreation({ revision: 0 })).ok).toBe(false)
    expect(parseCloudCreation(makeCreation({ updatedAt: 'yesterday' })).ok).toBe(false)
  })

  it('parses a paginated response and rejects an invalid item', () => {
    const valid = makeCreation()
    expect(parseCloudCreationPage({ items: [valid], nextCursor: null })).toMatchObject({ ok: true })
    expect(parseCloudCreationPage({ items: [{ ...valid, revision: -1 }] })).toMatchObject({ ok: false })
  })
  it('rejects inline image data until an asset has been uploaded', () => {
    const document = createDocument('postcard')
    document.elements.push({
      id: 'photo-inline',
      kind: 'photo',
      x: 10,
      y: 10,
      width: 30,
      image: 'data:image/png;base64,AAAA',
    })
    expect(parseCloudCreation(makeCreation({ format: 'postcard', document })).ok).toBe(false)
  })

})
