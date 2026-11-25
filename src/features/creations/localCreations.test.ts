import { describe, expect, it } from 'vitest'
import { createDocument } from '../studio/studioTypes'
import {
  CREATIONS_STORAGE_KEY,
  deleteLocalCreation,
  getCreationExcerpt,
  getLocalCreation,
  listLocalCreations,
  renameLocalCreation,
  saveLocalCreation,
} from './localCreations'

function createMemoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
}

describe('local creation library', () => {
  it('saves and lists multiple independent documents newest first', () => {
    const storage = createMemoryStorage()
    const first = { ...createDocument('letter'), updatedAt: '2026-11-24T12:00:00.000Z' }
    const second = { ...createDocument('postcard'), updatedAt: '2026-11-25T12:00:00.000Z' }

    expect(saveLocalCreation(first, storage)).toBe(true)
    expect(saveLocalCreation(second, storage)).toBe(true)
    expect(listLocalCreations(storage).map((item) => item.id)).toEqual([second.id, first.id])
  })

  it('updates an existing document rather than creating duplicates', () => {
    const storage = createMemoryStorage()
    const document = createDocument()
    saveLocalCreation(document, storage)
    saveLocalCreation({ ...document, name: 'A new title' }, storage)

    expect(listLocalCreations(storage)).toHaveLength(1)
    expect(getLocalCreation(document.id, storage)?.name).toBe('A new title')
  })

  it('migrates the previous single-draft key into the library', () => {
    const storage = createMemoryStorage()
    const legacy = createDocument('postcard')
    storage.setItem('lumie-studio-draft-v1', JSON.stringify(legacy))

    expect(listLocalCreations(storage).map((item) => item.id)).toEqual([legacy.id])
    expect(storage.getItem('lumie-studio-draft-v1')).toBeNull()
    expect(storage.getItem(CREATIONS_STORAGE_KEY)).not.toBeNull()
  })

  it('renames and deletes a saved document', () => {
    const storage = createMemoryStorage()
    const document = createDocument()
    saveLocalCreation(document, storage)

    expect(renameLocalCreation(document.id, '  A keepsake  ', storage)).toBe(true)
    expect(getLocalCreation(document.id, storage)?.name).toBe('A keepsake')
    expect(deleteLocalCreation(document.id, storage)).toBe(true)
    expect(listLocalCreations(storage)).toHaveLength(0)
  })

  it('rejects blank titles and returns a useful text excerpt', () => {
    const storage = createMemoryStorage()
    const document = createDocument()
    expect(saveLocalCreation(document, storage)).toBe(true)
    expect(renameLocalCreation(document.id, '   ', storage)).toBe(false)
    expect(getCreationExcerpt(document)).toContain('Dear you')
  })
})
